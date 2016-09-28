'use strict';

import { ParsedPath, parse, sep } from 'path';
import { Logger } from './log';

let log = Logger.create('SourceMap');

export class SourceMap {
    private baseToRemoteUrl: Map<string, string> = new Map();

    public setAllRemoteUrls(remoteUrls: string[]): void {
        this.baseToRemoteUrl.clear();
        remoteUrls.forEach(remoteUrl => {
            const parsedPath = parse(remoteUrl);
            this.baseToRemoteUrl.set(parsedPath.base, remoteUrl);
        });
    }

    public remoteSourceUrl(localUrl: string): string {
        const path = parse(localUrl);
        let remoteUrl: string;
        if (this.baseToRemoteUrl.has(path.base)) {
            remoteUrl = this.baseToRemoteUrl.get(path.base);
        } else {
            // Fallback
            remoteUrl = localUrl;
        }

        log.debug(`remoteSourceUrl requested for '${localUrl}' -> '${remoteUrl}'`);
        return remoteUrl;
    }
}