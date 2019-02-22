import * as assert from 'assert';
import * as crypto from 'crypto';
import { Logger } from 'node-file-log';
import { parse } from 'path';
import { LocalPaths, LocalSource } from './localSource';

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


type JSContextName = string;
type RemoteUrl = string;

const sourceMapLog = Logger.create('SourceMap');

/**
 * Provides bi-directional mapping from local sources, most likely files, to remote JS context names.
 *
 * The jsrdbg protocol speaks of URLs but these are actually not URLs but more like URIs or URNs.
 */
export class SourceMap {
    private map: ValueMap<JSContextName, LocalSource>;
    private _serverSource: ServerSource;
    /**
     * The source of scripts, that are loaded using the require() statement,
     * are not statically copied into the servers source, they must be loaded
     * dynamically, when require() is called or when the user wants to debug
     * inside a function of the required script (using breakpoints or step-in).
     */
    private _dynamicScripts: ValueMap<RemoteUrl, ServerSource>;

    constructor() {
        this.map = new ValueMap<JSContextName, LocalSource>();
        this._serverSource = new ServerSource();
        this._dynamicScripts = new ValueMap<RemoteUrl, ServerSource>();
    }

    set serverSource(sources: ServerSource) {
        this._serverSource = sources;
    }

    get serverSource() {
        return this._serverSource;
    }

    public addDynamicScript(remoteUrl: RemoteUrl, serverSource: ServerSource): void {
        this._dynamicScripts.set(remoteUrl, serverSource);
    }

    public addMapping(localSource: LocalSource, remoteName: JSContextName): void { // ← fake rocket science
        this.map.set(remoteName, localSource);
    }

    public toLocalPosition(line: number, url?: string): { source: string, line: number } {
        let serverSource;
        if (url && url !== this.serverSource.name) {
            sourceMapLog.info(`dynamic script`);
            serverSource = this.getDynamicServerSource(url);
        }
        if (!serverSource) {
            sourceMapLog.info(`main static script`);
            serverSource = this._serverSource;
        }

        const localPos = serverSource.toLocalPosition(line);

        const localSource = this.getSource(localPos.source);
        if (!localSource) {
            const message = `Local source '${localPos.source}' not found, remote line ${line}, local line ${localPos.line}`;
            // sourceMapLog.error(message);
            throw new Error(message);
        }

        const localSourceLine = localSource.getSourceLine(localPos.line);
        const remoteSourceLine = serverSource.getSourceLine(line);

        // sourceMapLog.info(`remote [${line}: "${remoteSourceLine}"] ` + `→ local [${localPos.line} in ${localSource.name}: "${localSourceLine}"]`);

        if (localSourceLine.trim() !== remoteSourceLine.trim()) {
            // source line doesn't match, there can be many reasons
            // we're trying to help the user and analysing the source...

            if (line === 1 && serverSource.hiddenStatement) {
                // Actually we should never reach this line, but this can happen
                // if upload was too slow and the debugger couldn't connect.
                // So simply map this line to first line (done in serverSource.toLocalPosition).
                return localPos;
            }
            const first = this._serverSource.chunks.find(chunk => (line >= chunk.pos.start) && (line < (chunk.pos.start + chunk.pos.len)));
            let duplicate;
            if (first) {
                duplicate = this._serverSource.chunks.find(chunk => (first.name === chunk.name) && (first.localStart === chunk.localStart) && (first.pos.len !== chunk.pos.len));
            }
            if (duplicate) {
                const message = `Duplicate #import in ${duplicate.name}, first occurrence at line ${duplicate.localStart - 1}`;
                // sourceMapLog.error(message);
                throw new Error(message);
            }

            const utf8string = utf8.decode(remoteSourceLine);
            if (localSourceLine.trim() !== utf8string.trim()) {
                const message = 'Not on same source line';
                // sourceMapLog.error(message);
                throw new Error(message);
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

            // sourceMapLog.info(`local [${localPos.line} in ${localPos.source}: "${localSourceLine}"] ` + `→ remote [${remoteLine}: "${remoteSourceLine}"]`);
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

    public getDynamicServerSource(remoteUrl: RemoteUrl): ServerSource | undefined {
        return this._dynamicScripts.get(remoteUrl);
    }

    public getSourceByReference(sourceReference: number): LocalSource | undefined {
        return sourceReference > 0 ?
            this.map.findValueIf(value => value.sourceReference === sourceReference) : undefined;
    }

    public setLocalUrls(localPaths: LocalPaths[]): void {
        localPaths.forEach(pathsElem => {
            if (!pathsElem.path) {
            // if path is an empty string, there are scripts with same name
            return;
            }
            const localSource = new LocalSource(pathsElem.path, pathsElem.paths);
            this.addMapping(localSource, localSource.aliasNames[0]);
        });
    }
    public setLocalUrlsSimple(localPaths: string[]): void {
        localPaths.forEach(path => {
            const localSource = new LocalSource(path);
            this.addMapping(localSource, localSource.aliasNames[0]);
        });
    }
}

class Pos {
    constructor(public start: number, public len: number) { }
}


/**
 * The generator of the server source added comment-lines and maybe a debugger-statement to
 * the server source. These comments and statements do not exist in the original source.
 *
 * But using the comment-lines, the server source can be seperated into chunks:
 * - The first chunk starts at line 1 of the server code.
 * - Every chunk, except the last one, ends immediately before a generated comment-line.
 * - Every chunk, except the first one, starts at a generated comment-line.
 *
 * A generated comment-line looks like this: "//# i name", meaning the original source of
 * this chunk starts at position i in the local file with name "name"(.js).
 *
 * The debugger-statement is generated to the first line of the main file before the server
 * source is generated, but only in the case that 'Upload and Debug Script' is executed.
 *
 * If a chunk starts at a comment-line, or contains the generated debugger-statement
 * the original source in the chunk starts one line behind the comment-line.
 * So we have 3 cases for the original source position inside the chunk:
 * - (1+2) The first chunk does not contain a generated comment but maybe it contains the generated debugger-statement.
 * - (3) All other chunks start at a generated comment-line and they do not contain a generated debugger-statement.
 *
 * See Documentation of Source Mapping with example in sourcemap.test.ts
 */
class Chunk {
    /**
     * Position of the original source in the chunk.
     * Calculated in constructor.
     */
    public originalStart: number;

    constructor(public name: string, public pos: Pos, public localStart: number, public debugAdded: boolean, firstChunk: boolean) {
        serverSourceLog.error(`chunk.pos.start ${pos.start} | firstChunk ${pos.start === 1} | debugAdded ${debugAdded}`);
        if (firstChunk) {
            // first chunk
            if (debugAdded) {
                // first chunk and debugger-statement added
                // length is not set on creation
                this.originalStart = pos.start + 1;
            } else {
                // the chunk matches the original source
                this.originalStart = pos.start;
            }
        } else {
            // not the first chunk ==> comment-line at start
            // length is not set on creation
            this.originalStart = pos.start + 1;
        }
    }
}

const serverSourceLog = Logger.create('ServerSource');

export class ServerSource {
    public static leadingDebuggerStmts(lines: string[]): number {
        let counter = 0;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith("debugger;")) {
                counter++;
            } else {
                break;
            }
        }
        return counter;
    }

    public static fromSources(contextName: string, sourceLines: string[], hiddenStatement = false, localSource?: LocalSource) {
        const chunks: Chunk[] = [];
        const staticScripts: string[] = [];
        const pattern = /^\/\/#\s([0-9]+)\s([\w\_\-\.#]+);?$/;
        let current: Chunk | undefined;

        // todo: make hiddenStatement local variable

        // case attach: check, if "debugger;" statement added to server source
        if (hiddenStatement === false && localSource !== undefined) {
            const numLocal = localSource.leadingDebuggerStmts();
            const numRemote = this.leadingDebuggerStmts(sourceLines);
            if (numRemote > numLocal) {
                hiddenStatement = true;
            }
        }

        // case launch: check, if "debugger;" statement really added to server source
        if (hiddenStatement === true && !sourceLines[0].trim().startsWith("debugger;")) {
            hiddenStatement = false;
        }

        // serverSourceLog.debug(`# server source lines ${sourceLines.length}`);
        sourceLines.forEach((line, index) => {

            // lines start at 1
            const lineNo = index + 1;

            // serverSourceLog.debug(`${lineNo}: ${line}`);
            line = line.trim();
            const match = line.match(pattern);
            if (match) {

                if (chunks.length === 0) {
                    // add first chunk, don't check length, add it anyway
                    // because toLocalPosition() is easier to handle then,
                    // because first chunk looks different (no "//#..." at start)
                    chunks.push(new Chunk(contextName, new Pos(1, lineNo - 1), 1, hiddenStatement, true));
                    // serverSourceLog.debug(`(CHUNK[0]) name ${contextName} remote pos ${1} len ${sourceLines.length} local pos ${1}`);
                }

                const offset = Number(match[1]);
                const name = match[2];
                if (staticScripts.indexOf(name) < 0) {
                    staticScripts.push(name);
                }

                // the start of the source in the local file
                // lines start at 1
                let localPos = 1 + offset;

                if (hiddenStatement && (name === contextName)) {
                    // the chunk belongs to the mainfile and the debugger-statement was added,
                    // we have to subtract 1, because the debugger-statement does not exist
                    // in local file
                    localPos -= 1;
                }

                if (current) {
                    current.pos.len = lineNo - current.pos.start;
                    if (current.pos.len > 0) {
                        // serverSourceLog.debug(`CHUNK[${chunks.length}] name ${current.name} remote line ${current.pos.start} len ${current.pos.len} local line ${current.localStart}`);
                        chunks.push(current);
                    } else {
                        current = undefined;
                    }
                }

                const remotePos = lineNo;
                // pos.len must be set in next iteration
                current = new Chunk(name, new Pos(remotePos, 0), localPos, hiddenStatement, false);
            }
        });
        if (current) {
            // last chunk, resolve pos.len like above
            const index = sourceLines.length;
            const lineNo = index + 1;
            current.pos.len = lineNo - current.pos.start;
            // serverSourceLog.debug(`CHUNK[${chunks.length}] name ${current.name} pos ${current.pos.start} len ${current.pos.len} local ${current.localStart}`);
            chunks.push(current);
        }

        // if no "//#..."-comments in source, add only one first chunk
        // this chunk looks different, because there's no "//#..."-line at start
        if (chunks.length === 0) {
            chunks.push(new Chunk(contextName, new Pos(1, sourceLines.length), 1, hiddenStatement, true));
            // serverSourceLog.debug(`(CHUNK[0]) name ${contextName} remote pos ${1} len ${sourceLines.length} local pos ${1}`);
        }


        // first chunk can have length 0
        assert.equal(chunks.filter(c => (c !== chunks[0] && c.pos.len === 0)).length, 0);

        const s = new ServerSource();
        s._chunks = chunks;
        s._staticScripts = staticScripts,
        s._sourceLines = sourceLines;
        s._hiddenStatement = hiddenStatement;
        s._name = contextName;
        return s;
    }

    private _chunks: Chunk[] = [];
    private _sourceLines: string[] = [];
    private _hiddenStatement: boolean = false;
    private _name: string = "";
    private _staticScripts: string[] = [];

    get chunks() {
        return this._chunks;
    }
    public getSourceCode(): string {
        return this._sourceLines.reduce((a: any, b: any) => a + "\n" + b);
    }
    /**
     * returns true, if the internal "debugger;" statement was inserted to
     * this server source
     */
    get hiddenStatement() {
        return this._hiddenStatement;
    }
    get name() {
        return this._name;
    }
    get staticScripts() {
        return this._staticScripts;
    }



    /**
     * See documentation in "test/sourceMap.test.ts"
     */
    public toLocalPosition(line: number): { source: string, line: number } {
        assert.ok(this._chunks.length > 0, "expected at least one chunk");

        let idx;

        idx = this._chunks.findIndex(chunk => (line >= chunk.pos.start) && (line < (chunk.pos.start + chunk.pos.len)));
        if (idx < 0) {
            throw new Error(`Line ${line} not found on server`);
        }
        const firstChunk = (idx === 0);
        const chunk = this._chunks[idx];

        if (!firstChunk && (line === chunk.pos.start)) {
            // line is a generated comment-line
            // this line cannot be mapped, because it does not exist in local code,
            // but additional it's a comment so the debugger should not be in this line,
            // something must be wrong...
            throw new Error(`Unexpected call of ServerSource.toLocalPosition with line: ${line} === chunk-start: ${chunk.pos.start}`);
        }

        if (this.hiddenStatement && firstChunk && (line === 1)) {
            // line is at the generated debugger-statement in first line
            // map to first line, but the debug-adapter skips this line anyway
            return {
                source: chunk.name,
                line: 1
            };
        }

        const localCodeStart = chunk.originalStart;
        // todo remove
        const localCodeStart2 = chunk.pos.start + ((!firstChunk || this.hiddenStatement) ? 1 : 0);
        if (localCodeStart !== localCodeStart2) {
            serverSourceLog.error(`localCodeStart (${localCodeStart}) !== localCodeStart2 (${localCodeStart2})`);
        }

        // the offset of the line inside the chunk
        const chunkOffset = line - localCodeStart;
        // serverSourceLog.debug(`(toLocalPosition) REMOTE CHUNK[${idx}]: content-start ${chunk.pos.start + 1} current line ${line} => offset ${chunkOffset}`);

        // the line in local file
        const localLine = chunk.localStart + chunkOffset;
        // serverSourceLog.debug(`(toLocalPosition) LOCAL: content-start ${chunk.localStart} => current line (content-start + offset) ${localLine}`);

        return {
            source: chunk.name,
            line: localLine
        };
    }

    public toRemoteLine(pos: { source: string, line: number }): number {
        // serverSourceLog.debug(`(toRemoteLine) LOCAL: source file ${pos.source}.js, line ${pos.line}`);

        const idx = this._chunks.findIndex(chunk => (pos.source === chunk.name) &&
            (pos.line >= chunk.localStart) && (pos.line < (chunk.localStart + chunk.pos.len)));
        if (idx < 0) {
            throw new Error(`${pos.source} line ${pos.line} not found on server`);
        }
        // serverSourceLog.debug(`(toRemoteLine) found CHUNK[${idx}]: starts in ${pos.source}.js at ${this.chunks[idx].localStart} and in remote at ${this.chunks[idx].pos.start} (+1)`);

        const firstChunk = (idx === 0);
        const chunk = this.chunks[idx];

        // the chunk offset in the local file
        const localChunkOffset = pos.line - chunk.localStart;

        const chunkCodeStart = chunk.originalStart;
        // todo remove
        const chunkCodeStart2 = chunk.pos.start + ((!firstChunk || this.hiddenStatement) ? 1 : 0);
        if (chunkCodeStart !== chunkCodeStart2) {
            serverSourceLog.error("chunkCodeStart !== chunkCodeStart2");
        }

        const lineNo = chunkCodeStart + localChunkOffset;
        // serverSourceLog.debug(`(toRemoteLine) chunk offset in local file ${localChunkOffset} => REMOTE offset ${lineNo}`);

        return lineNo;
    }

    public getSourceLine(lineNo: number): string {
        return this._sourceLines[lineNo - 1];
    }
}
