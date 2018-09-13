import * as assert from 'assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Logger } from 'node-file-log';
import { parse, ParsedPath, sep } from 'path';

// tslint:disable-next-line:no-var-requires
const utf8 = require('utf8');

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
        if (!localSource) {
            throw new Error(`Local source not found ${localPos.source}, remote line ${line}, local line ${localPos.line}`);
        }

        const localSourceLine = localSource.getSourceLine(localPos.line);
        const remoteSourceLine = this._serverSource.getSourceLine(line);

        sourceMapLog.info(
            `remote [${line}: "${remoteSourceLine}"] ` +
            `→ local [${localPos.line} in ${localSource.name}: "${localSourceLine}"]`);

        if (localSourceLine.trim() !== remoteSourceLine.trim()) {
            sourceMapLog.debug(`(toLocalPosition) try utf8...`);
            const utf8string = utf8.decode(remoteSourceLine);
            sourceMapLog.info(`(toLocalPosition) ` +
                `remote [${line}: "${utf8string}"] ` +
                `→ local [${localPos.line} in ${localSource.name}: "${localSourceLine}"]`);
            if (localSourceLine.trim() !== utf8string.trim()) {
                throw new Error('Not on same source line');
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
    constructor(public name: string, public pos: Pos, public localStart: number) { }
}

const serverSourceLog = Logger.create('ServerSource');

export class ServerSource {
    public static fromSources(contextName: string, sourceLines: string[], debugAdded = false) {
        const chunks: Chunk[] = [];
        const pattern = /^\/\/#\s([0-9]+)\s([\w\_\-\.#]+)$/;
        let current: Chunk | undefined;
        sourceLines.forEach((line, index) => {
            const lineNo = index + 1;
            // serverSourceLog.info(`${lineNo}: ${line}`);
            line = line.trim();
            const match = line.match(pattern);
            if (match) {
                let localPos = Number(match[1]);
                const name = match[2];
                if (!debugAdded || name !== contextName) {
                    // meaning if not the debug statement in first line was added to this file
                    localPos += 1;
                }
                if (current) {
                    current.pos.len = lineNo - current.pos.start;
                    if (current.pos.len > 0) {
                        // serverSourceLog.info(`CHUNK[${chunks.length}] name ${current.name} remote line ${current.pos.start} len ${current.pos.len} local line ${current.localStart}`);
                        chunks.push(current);
                    } else {
                        current = undefined;
                    }
                }
                const remotePos = lineNo;
                current = new Chunk(name, new Pos(remotePos, 0), localPos);
            }
        });

        if (current) {
            const lineNo = sourceLines.length + 1;
            current.pos.len = lineNo - current.pos.start;
            // serverSourceLog.info(`CHUNK[${chunks.length}] name ${current.name} pos ${current.pos.start} len ${current.pos.len} local ${current.localStart}`);
            chunks.push(current);
        }

        const s = new ServerSource();
        // if a chunk has no length, it's not a chunk
        assert.equal(chunks.filter(c => c.pos.len === 0).length, 0);
        if (chunks.length === 0) {
            const remotePos = debugAdded ? 1 : 0;
            chunks.push(new Chunk(contextName, new Pos(remotePos, sourceLines.length), 1));
            // serverSourceLog.info(`(CHUNK[0]) name ${contextName} remote pos ${remotePos} len ${sourceLines.length} local pos ${1}`);
        }
        s._chunks = chunks;
        s._sourceLines = sourceLines;
        return s;
    }

    private _chunks: Chunk[] = [];
    private _sourceLines: string[] = [];
    private _yOffset: number | undefined;

    get chunks() { return this._chunks; }

    public getSourceCode(): string {
        return this._sourceLines.reduce((a: any, b: any) => a + "\n" + b);
    }

    set yOffset(newOffset: number | undefined) {
        // serverSourceLog.debug(`setting new yOffset to ${newOffset}, was ${this._yOffset}`);
        this._yOffset = newOffset;
    }

    get yOffset(): number | undefined {
        return this._yOffset;
    }

    public toLocalPosition(line: number): { source: string, line: number } {
        assert.ok(this._chunks.length > 0, "expected at least one chunk");

        // lines start at 1
        const idx = this._chunks.findIndex(chunk => (line > chunk.pos.start) && (line <= (chunk.pos.start + chunk.pos.len)));
        if (idx >= 0) {
            // yOffset is actually not necessary anymore, because we get
            // the local position from the comment in the remote file
            if (this._yOffset === undefined) {
                if (this._chunks.length === 1) {
                    this._yOffset = 1;
                } else {
                    this._yOffset = this._chunks[0].pos.start - 1;
                }
            }

            const chunk = this._chunks[idx];
            let localLine: number;
            // the offset inside the chunk
            const chunkOffset = (line - (chunk.pos.start + 1));
            serverSourceLog.info(`(Source-Mapping/toLocalPosition) CHUNK[${idx}]: start ${chunk.pos.start} line ${line} => offset ${chunkOffset}`);
            // the line in local source
            localLine = chunk.localStart + chunkOffset;
            serverSourceLog.info(`(Source-Mapping/toLocalPosition) LOCAL: chunk-start ${chunk.localStart} => line (start + offset) ${localLine}`);
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

        // serverSourceLog.info(`(Source-Mapping/toRemoteLine) LOCAL: source file ${pos.source}.js, line ${pos.line}`);
        const idx = this._chunks.findIndex(chunk => (pos.source === chunk.name) &&
            (pos.line >= chunk.localStart) && (pos.line < (chunk.localStart + chunk.pos.len)));
        if (idx < 0) {
            // serverSourceLog.info(`(Source-Mapping/toRemoteLine) error: idx ${idx} return 0`);
            return 0;
        }
        // serverSourceLog.info(`(Source-Mapping/toRemoteLine) found CHUNK[${idx}]: starts in ${pos.source}.js at ${this.chunks[idx].localStart} and in remote at ${this.chunks[idx].pos.start} (+1)`);

        // the chunk offset in the local file
        const localChunkOffset = pos.line - this.chunks[idx].localStart;
        const lineNo = (this.chunks[idx].pos.start + 1) + localChunkOffset;
        // serverSourceLog.info(`(Source-Mapping/toRemoteLine) chunk offset in local file ${localChunkOffset} => REMOTE offset ${lineNo}`);

        return lineNo;
    }

    public getSourceLine(lineNo: number): string {
        return this._sourceLines[lineNo - 1];
    }
}
