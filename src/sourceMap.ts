'use strict';

import { parse, ParsedPath, sep } from 'path';
import { Logger } from './log';

export class LocalSource {
    /** The local absolute path to this source. */
    public path: string;
    /** An array of possible alias names. */
    public names: string[];

    constructor(path: string) {
        this.path = path;
        this.names = [];
    }
}

export type RemoteName = string;

let log = Logger.create('SourceMap');

/**
 * Provides bi-directional mapping from local to remote source names.
 *
 * The API speaks of URLs but these are actually no URLs but more like URIs.
 */
export class SourceMap {
    private map: Map<RemoteName, LocalSource>;

    constructor() {
        this.map = new Map<RemoteName, LocalSource>();
    }

    get size(): number {
        return this.map.size;
    }

    public clear(): void {
        this.map.clear();
    }

    public setAllRemoteUrls(remoteNames: RemoteName[]): void {
        log.debug(`setAllRemoteUrls: ${JSON.stringify(remoteNames)}`);

        this.map.clear();
        remoteNames.forEach(remoteName => {
            const parsedPath = parse(remoteName);
            let localSource = new LocalSource('');
            if (parsedPath.base.length > 0) {
                localSource.names.push(parsedPath.base);
            }
            this.map.set(remoteName, localSource);
        });
    }

    public addMapping(localSource: LocalSource, remoteName: RemoteName): void {
        this.map.set(remoteName, localSource);
    }

    public getRemoteUrl(localPath: string): RemoteName {
        const parsedPath = parse(localPath);
        let remoteName: RemoteName | undefined;

        this.map.forEach((value: LocalSource, key: RemoteName) => {
            if (!remoteName) {
                if (value.path === localPath) {
                    remoteName = key;
                }
            }
        });

        if (!remoteName) {
            // Find by one of the alias names
            this.map.forEach((value: LocalSource, key: RemoteName) => {
                if (!remoteName) {
                    for (let name of value.names) {
                        if (name === parsedPath.base) {
                            remoteName = key;
                        }
                    }
                }
            });
        }

        if (remoteName === undefined) {
            // Fallback
            remoteName = localPath;
            log.warn(`no remote name found for '${localPath}'`);
        }
        log.debug(`getRemoteUrl: '${localPath}' -> '${remoteName}'`);
        return remoteName;
    }

    public getLocalSource(remoteName: RemoteName): LocalSource {
        const localSource = this.map.get(remoteName);
        if (localSource === undefined) {
            return new LocalSource('');
        }
        return localSource;
    }
}
