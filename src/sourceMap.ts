import * as assert from 'assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Logger } from 'node-file-log';
import { parse, ParsedPath, sep } from 'path';

class ValueMap<K, V> extends Map<K, V> {

    public findKeyIf(predicate: (value: V) => boolean): K | undefined {
        for (const entry of this) {
            if (predicate(entry[1])) {
                return entry[0];
            }
        }
        return undefined;
    }

    public findValueIf(predicate: (value: V) => boolean): V | undefined {
        for (const value of this.values()) {
            if (predicate(value)) {
                return value;
            }
        }
        return undefined;
    }
}

function randU32(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        crypto.randomBytes(4, (err, buf) => {
            if (err) {
                reject(err);
            } else {
                resolve(buf.readUInt32BE(0, true));
            }
        });
    });
}

/**
 * A local source file.
 *
 * Does not necessarily need to exist on disk.
 */
export class LocalSource {
    /** The name of this source. Usually a file name. */
    public readonly name: string;
    /** The local absolute path to this source. */
    public readonly path: string;
    /** An array of possible alias names. */
    public aliasNames: string[];
    /** An artificial key that iff > 0 is used by VS Code to retrieve the source through the SourceRequest. */
    public sourceReference: number;

    constructor(path: string) {
        const parsedPath = parse(path);
        this.path = path;
        this.name = parsedPath.base;
        this.aliasNames = [
            parsedPath.name,
            parsedPath.base
        ];
        this.sourceReference = 0;
    }

    public loadFromDisk(): string {
        return fs.readFileSync(this.path, 'utf8');
    }

    public getSourceLine(lineNo: number): string {
        const fileContents = this.loadFromDisk();
        const lines = fileContents.split("\n");
        return lines[lineNo - 1].trim();
    }

    public sourceName(): string {
        return parse(this.path).name;
    }
}

type JSContextName = string;

const log = Logger.create('SourceMap');

/**
 * Provides bi-directional mapping from local sources, most likely files, to remote JS context names.
 *
 * The jsrdbg protocol speaks of URLs but these are actually not URLs but more like URIs or URNs.
 */
export class SourceMap {
    private map: ValueMap<JSContextName, LocalSource>;
    private _serverSource: ServerSource;

    constructor() {
        this.map = new ValueMap<JSContextName, LocalSource>();
        this._serverSource = new ServerSource();
    }

    set serverSource(sources: ServerSource) {
        this._serverSource = sources;
    }

    public addMapping(localSource: LocalSource, remoteName: JSContextName): void { // ← fake rocket science
        this.map.set(remoteName, localSource);
    }

    public toLocalPosition(line: number): { source: string, line: number } {
        const localPos = this._serverSource.toLocalPosition(line);
        if (log) {
            const localSource = this.getSource(localPos.source);
            if (localSource) {
                log.info(
                    `remote [${line}: "${this._serverSource.getSourceLine(line)}"] → local [${localPos.line} in ${localSource.name}: "${localSource.getSourceLine(localPos.line)}"]`);
            }
        }
        return localPos;
    }

    public getRemoteUrl(localPath: string): JSContextName {
        const parsedPath = parse(localPath);
        let remoteName: JSContextName | undefined;

        remoteName = this.map.findKeyIf(value => value.path === localPath);

        if (!remoteName) {
            remoteName = this.map.findKeyIf(value => value.aliasNames.indexOf(parsedPath.base) !== -1);
        }

        if (!remoteName) {
            // Fallback
            remoteName = localPath;
            log.warn(`no remote name found for '${localPath}'`);
        }
        log.debug(`getRemoteUrl: '${localPath}' → '${remoteName}'`);
        return remoteName;
    }

    public getSource(remoteName: JSContextName): LocalSource | undefined {
        return this.map.get(remoteName);
    }

    public getSourceByReference(sourceReference: number): LocalSource | undefined {
        return sourceReference > 0 ?
            this.map.findValueIf(value => value.sourceReference === sourceReference) : undefined;
    }

    public setLocalUrls(localPaths: string[]): void {
        localPaths.forEach(path => {
            const localSource = new LocalSource(path);
            this.addMapping(localSource, localSource.aliasNames[0]);
        });
    }
}

class Pos {
    constructor(public start: number, public len: number) { }
}

class Chunk {
    constructor(public name: string, public pos: Pos) { }
}

export class ServerSource {
    public static fromSources(sourceLines: string[]) {
        const chunks: Chunk[] = [];
        const pattern = /^\/\/#\s\d+\s([\w\_\-\.#]+)$/;
        let current: Chunk | undefined;
        sourceLines.forEach((line, index) => {
            const lineNo = index + 1;
            line = line.trim();
            const match = line.match(pattern);
            if (match) {
                if (current) {
                    current.pos.len = lineNo - current.pos.start;
                    if (current.pos.len > 0) {
                        chunks.push(current);
                    } else {
                        current = undefined;
                    }
                }
                let start = lineNo;
                if (!current) {
                    start = lineNo + 1;
                }
                current = new Chunk(match[1], new Pos(start, 0));
            }
        });

        if (current) {
            current.pos.len = (sourceLines.length + 1) - current.pos.start;
            chunks.push(current);
        }

        const s = new ServerSource();
        // if a chunk has no length, it's not a chunk
        assert.equal(chunks.filter(c => c.pos.len === 0).length, 0);
        s._chunks = chunks;
        s.sourceLines = sourceLines;
        return s;
    }

    private _chunks: Chunk[] = [];
    private sourceLines: string[] = [];

    get chunks() { return this._chunks; }

    public toLocalPosition(line: number): { source: string, line: number } {
        const idx = this._chunks.findIndex(chunk =>
            (line >= chunk.pos.start) && (line < (chunk.pos.start + chunk.pos.len)));
        if (idx >= 0) {
            // y is an offset that we calculate from the total chunk count. During
            // pre-processing JANUS and/or DOCUMENTS adds y = n - 1 lines at the beginning
            // of the actual script whereas n is the no. of chunks. Why? I don't know. But
            // we have to take this into account when we calculate the local line offset.
            // Anyway, there can be more code before the first chunk (probably just a
            // 'debugger;' statement).
            const y = this._chunks[0].pos.start - 1;

            const chunk = this._chunks[idx];
            let localLine = 0;
            if (idx === 0) {
                localLine = line - y;
            } else {
                localLine = line - chunk.pos.start + 1;
            }
            assert.ok(localLine > 0);
            return {
                source: chunk.name, line: localLine
            };
        }
        // Fallback
        return {
            source: this._chunks[0].name, line: 1
        };
    }

    public getSourceLine(lineNo: number): string {
        return this.sourceLines[lineNo - 1];
    }
}
