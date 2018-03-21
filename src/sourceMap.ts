'use strict';

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
        this.path = path;
        this.name = parse(path).base;
        this.aliasNames = [];
        this.sourceReference = 0;
    }

    public loadFromDisk(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(this.path, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    public sourceName(): string {
        return parse(this.path).name;
    }
}

const log = Logger.create('SourceMap');

/**
 * Provides bi-directional mapping from local to remote source names.
 *
 * The Debugger Protocol speaks of URLs but these are actually no URLs but more like URIs or URNs.
 */
export class SourceMap {
    private map: ValueMap<string, LocalSource>;

    constructor() {
        this.map = new ValueMap<string, LocalSource>();
    }

    get size(): number {
        return this.map.size;
    }

    public clear(): void {
        this.map.clear();
    }

    public setAllRemoteUrls(remoteNames: string[]): void {
        log.debug(`setAllRemoteUrls: ${JSON.stringify(remoteNames)}`);

        this.map.clear();
        remoteNames.forEach(remoteName => {
            const parsedPath = parse(remoteName);
            const localSource = new LocalSource('');
            if (parsedPath.base.length > 0) {
                localSource.aliasNames.push(parsedPath.base);
            }
            this.map.set(remoteName, localSource);
        });
    }

    public addMapping(localSource: LocalSource, remoteName: string): void {
        this.map.set(remoteName, localSource);
    }

    public getRemoteUrl(localPath: string): string {
        const parsedPath = parse(localPath);
        let remoteName: string | undefined;

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

    public getSource(remoteName: string): LocalSource | undefined {
        return this.map.get(remoteName);
    }

    public getSourceByReference(sourceReference: number): LocalSource | undefined {
        return sourceReference > 0 ?
            this.map.findValueIf(value => value.sourceReference === sourceReference) : undefined;
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
        const pattern = /^\/\/#\s\d+\s(\w+)$/;
        let current: Chunk | undefined;
        sourceLines.forEach((line, index) => {
            const match = line.match(pattern);
            if (match) {
                if (current) {
                    current.pos.len = index - current.pos.start;
                    chunks.push(current);
                }
                current = new Chunk(match[1], new Pos(index + 1, 0));
            }
        });

        if (current) {
            current.pos.len = sourceLines.length - current.pos.start;
            chunks.push(current);
        }

        const s = new ServerSource();
        s._chunks = chunks;
        return s;
    }

    private _chunks: Chunk[];

    constructor() {
        this._chunks = [];
    }

    get chunks() { return this._chunks; }

    public toLocalPosition(line: number): { source: string, line: number } {
        const idx = this._chunks.findIndex(chunk =>
            (line >= chunk.pos.start) && (line <= (chunk.pos.start + chunk.pos.len)));
        if (idx > 0) {
            const chunk = this._chunks[idx];
            let localLine = line - chunk.pos.start;
            if (localLine === 0) {
                localLine = 1;
            }
            return {
                source: chunk.name, line: localLine
            };
        }
        return {
            source: this._chunks[0].name, line: 1
        };
    }
}
