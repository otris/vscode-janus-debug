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

    /**
     * See documentation in "test/sourceMap.test.ts"
     */
    public toLocalPosition(line: number): { source: string, line: number } {
        const localPos = this._serverSource.toLocalPosition(line);

        const localSource = this.getSource(localPos.source);
        if (!localSource) {
            throw new Error(`Local source not found ${localPos.source}, remote line ${line}, local line ${localPos.line}`);
        }

        // sourceMapLog.info(`(SourceMap/toLocalPosition) line ${line} localPos.line ${localPos.line}`);
        const localSourceLine = localSource.getSourceLine(localPos.line);
        // sourceMapLog.info(`(SourceMap/toLocalPosition) localSourceLine ${localSourceLine}`);
        const remoteSourceLine = this._serverSource.getSourceLine(line);

        sourceMapLog.info(`remote [${line}: "${remoteSourceLine}"] ` + `→ local [${localPos.line} in ${localSource.name}: "${localSourceLine}"]`);

        if (localSourceLine.trim() !== remoteSourceLine.trim()) {
            // sourceMapLog.debug(`(SourceMap/toLocalPosition) try utf8...`);
            const utf8string = utf8.decode(remoteSourceLine);
            // sourceMapLog.info(`(SourceMap/toLocalPosition) ` + `remote [${line}: "${utf8string}"] ` + `→ local [${localPos.line} in ${localSource.name}: "${localSourceLine}"]`);
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
    /**
     * See documentation in "test/sourceMap.test.ts"
     */
    public static fromSources(contextName: string, sourceLines: string[], debugAdded = false) {
        const chunks: Chunk[] = [];
        const pattern = /^\/\/#\s([0-9]+)\s([\w\_\-\.#]+)$/;
        let current: Chunk | undefined;
        sourceLines.forEach((line, index) => {

            // lines start at 1
            const lineNo = index + 1;

            // serverSourceLog.info(`${lineNo}: ${line}`);
            line = line.trim();
            const match = line.match(pattern);
            if (match) {
                const offset = Number(match[1]);
                const name = match[2];

                // lines start at 1
                let localPos = 1 + offset;

                if (debugAdded && (name === contextName)) {
                    // meaning if debugger;-statement was added to this file
                    // (debugger;-statement is only added to main file)
                    localPos -= 1;
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
            // next lineNo, add 1 because server file does not end with new-line
            const lineNo = sourceLines.length + 1;
            current.pos.len = lineNo - current.pos.start;
            // serverSourceLog.info(`CHUNK[${chunks.length}] name ${current.name} pos ${current.pos.start} len ${current.pos.len} local ${current.localStart}`);
            chunks.push(current);
        }

        // special case: only one chunk --> no imports in file
        if (chunks.length === 0) {
            // when debugger;-statement added to first line, the server file starts
            // in line 2, because the debug-adapter internally jumped over the first line
            const remotePos = debugAdded ? 2 : 1;
            chunks.push(new Chunk(contextName, new Pos(remotePos, sourceLines.length), 1));
            // serverSourceLog.info(`(CHUNK[0]) name ${contextName} remote pos ${remotePos} len ${sourceLines.length} local pos ${1}`);
        }


        // if a chunk has no length, it's not a chunk
        assert.equal(chunks.filter(c => c.pos.len === 0).length, 0);

        const s = new ServerSource();
        s._chunks = chunks;
        s._sourceLines = sourceLines;
        return s;
    }

    private _chunks: Chunk[] = [];
    private _sourceLines: string[] = [];

    get chunks() {
        return this._chunks;
    }

    public getSourceCode(): string {
        return this._sourceLines.reduce((a: any, b: any) => a + "\n" + b);
    }


    /**
     * See documentation in "test/sourceMap.test.ts"
     */
    public toLocalPosition(line: number): { source: string, line: number } {
        assert.ok(this._chunks.length > 0, "expected at least one chunk");

        let idx;

        // special case: one chunk (no #import in file)
        if (this.chunks.length === 1) {
            idx = 0;
            // there is only one chunk! the mapping is a bit different, because
            // there is no //# ... in the server file

            const chunk = this._chunks[0];
            // do not add 1 to chunk.pos.start, because here is no //#... in server file
            const chunkOffset = (line - (chunk.pos.start));
            // serverSourceLog.info(`(ServerSource/toLocalPosition #) CHUNK[${idx}]: start ${chunk.pos.start} line ${line} => offset ${chunkOffset}`);
            const localLine = chunk.localStart + chunkOffset;
            // serverSourceLog.info(`(ServerSource/toLocalPosition #) LOCAL: chunk-start ${chunk.localStart} => line (start + offset) ${localLine}`);
            return {
                source: chunk.name,
                line: localLine
            };
        }

        // usual case: more than one chunk (#import in file)
        idx = this._chunks.findIndex(chunk =>
            (line >= chunk.pos.start) && (line < (chunk.pos.start + chunk.pos.len)));
        if (idx >= 0) {
            // there are several chunks, each chunk starts at //# ... in server file

            const chunk = this._chunks[idx];
            // the offset inside the chunk
            const chunkOffset = (line - (chunk.pos.start + 1));
            // serverSourceLog.info(`(ServerSource/toLocalPosition) REMOTE CHUNK[${idx}]: content-start ${chunk.pos.start + 1} current line ${line} => offset ${chunkOffset}`);
            // the line in local source
            const localLine = chunk.localStart + chunkOffset;
            // serverSourceLog.info(`(ServerSource/toLocalPosition) LOCAL: content-start ${chunk.localStart} => current line (content-start + offset) ${localLine}`);
            return {
                source: chunk.name,
                line: localLine
            };
        }


        // Fallback
        return {
            source: this._chunks[0].name, line: 1
        };
    }

    public toRemoteLine(pos: { source: string, line: number }): number {

        // serverSourceLog.info(`(ServerSource/toRemoteLine) LOCAL: source file ${pos.source}.js, line ${pos.line}`);
        const idx = this._chunks.findIndex(chunk => (pos.source === chunk.name) &&
            (pos.line >= chunk.localStart) && (pos.line < (chunk.localStart + chunk.pos.len)));
        if (idx < 0) {
            // serverSourceLog.info(`(ServerSource/toRemoteLine) error: idx ${idx} return 0`);
            return 0;
        }
        // serverSourceLog.info(`(ServerSource/toRemoteLine) found CHUNK[${idx}]: starts in ${pos.source}.js at ${this.chunks[idx].localStart} and in remote at ${this.chunks[idx].pos.start} (+1)`);

        // the chunk offset in the local file
        const localChunkOffset = pos.line - this.chunks[idx].localStart;
        const lineNo = (this.chunks[idx].pos.start + 1) + localChunkOffset;
        // serverSourceLog.info(`(ServerSource/toRemoteLine) chunk offset in local file ${localChunkOffset} => REMOTE offset ${lineNo}`);

        return lineNo;
    }

    public getSourceLine(lineNo: number): string {
        return this._sourceLines[lineNo - 1];
    }
}
