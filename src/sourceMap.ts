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

const sourceMapLog = Logger.create('SourceMap');

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

    get serverSource() {
        return this._serverSource;
    }

    public addMapping(localSource: LocalSource, remoteName: JSContextName): void { // ← fake rocket science
        this.map.set(remoteName, localSource);
    }

    public toLocalPosition(line: number): { source: string, line: number } {
        const localPos = this._serverSource.toLocalPosition(line);

        const localSource = this.getSource(localPos.source);
        if (localSource) {
            const localSourceLine = localSource.getSourceLine(localPos.line);
            const remoteSourceLine = this._serverSource.getSourceLine(line);

            sourceMapLog.info(
                `remote [${line}: "${remoteSourceLine}"] ` +
                `→ local [${localPos.line} in ${localSource.name}: "${localSourceLine}"]`);

            if (localSourceLine.trim() !== remoteSourceLine.trim()) {
                sourceMapLog.debug(`We're off. Current offset: ${this._serverSource.yOffset}`);
            }
        }
        return localPos;
    }

    public toRemoteLine(localPos: { source: string, line: number }): number {
        const remoteLine = this._serverSource.toRemoteLine(localPos);
        const localSource = this.getSource(localPos.source);
        if (localSource) {
            const localSourceLine = localSource.getSourceLine(localPos.line);
            const remoteSourceLine = this._serverSource.getSourceLine(remoteLine);

            sourceMapLog.info(`local [${localPos.line} in ${localPos.source}: "${localSourceLine}"] ` +
                `→ remote [${remoteLine}: "${remoteSourceLine}"]`);
        }
        return remoteLine;
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
            sourceMapLog.warn(`no remote name found for '${localPath}'`);
        }
        sourceMapLog.debug(`getRemoteUrl: '${localPath}' → '${remoteName}'`);
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

const serverSourceLog = Logger.create('ServerSource');

export class ServerSource {
    public static fromSources(contextName: string, sourceLines: string[]) {
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
        if (chunks.length === 0) {
            chunks.push(new Chunk(contextName, new Pos(1, sourceLines.length)));
        }
        s._chunks = chunks;
        s.sourceLines = sourceLines;
        return s;
    }

    private _chunks: Chunk[] = [];
    private sourceLines: string[] = [];
    private _yOffset: number | undefined;

    get chunks() { return this._chunks; }

    set yOffset(newOffset: number | undefined) {
        serverSourceLog.debug(`setting new yOffset to ${newOffset}, was ${this._yOffset}`);
        this._yOffset = newOffset;
    }

    get yOffset(): number | undefined {
        return this._yOffset;
    }

    public toLocalPosition(line: number): { source: string, line: number } {
        assert.ok(this._chunks.length > 0, "expected at least one chunk");

        const idx = this._chunks.findIndex(chunk =>
            (line >= chunk.pos.start) && (line < (chunk.pos.start + chunk.pos.len)));
        if (idx >= 0) {
            // yOffset is an offset that we calculate from the total chunk count. During
            // pre-processing JANUS and/or DOCUMENTS adds yOffset = n - 1 lines at the beginning
            // of the actual script whereas n is the no. of chunks. Why? I don't know. But
            // we have to take this into account when we calculate the local line offset.
            // Anyway, there can be more code before the first chunk (probably just a
            // 'debugger;' statement) but who knows.
            if (this._yOffset === undefined) {
                if (this._chunks.length === 1) {
                    this._yOffset = 1;
                } else {
                    this._yOffset = this._chunks[0].pos.start - 1;
                }
            }

            const chunk = this._chunks[idx];
            let localLine: number;
            if (idx === 0) {
                localLine = line - this._yOffset;
            } else {
                localLine = line - chunk.pos.start + 1;
            }
            if (localLine === 0) {
                localLine = 1;
            }
            return {
                source: chunk.name, line: localLine
            };
        }
        // Fallback
        return {
            source: this._chunks[0].name, line: 1
        };
    }

    public toRemoteLine(pos: { source: string, line: number }): number {
        if (this._yOffset === undefined) {
            if (this._chunks.length === 0) {
                this._yOffset = 1;
            } else {
                this._yOffset = this._chunks[0].pos.start - 1; // This is the junk at the start
            }
        }

        let lineNo = this._yOffset;
        for (const chunk of this._chunks) {
            if (chunk.name === pos.source) {
                return lineNo += pos.line;
            } else {
                lineNo += chunk.pos.len;
            }
        }
        return lineNo;
    }

    public getSourceLine(lineNo: number): string {
        return this.sourceLines[lineNo - 1];
    }
}
