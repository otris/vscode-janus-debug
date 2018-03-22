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
