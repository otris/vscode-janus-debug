'use strict';

import { ParsedPath, parse, sep } from 'path';

export class SourceMap {
    private baseToRemoteUrl: Map<string, string> = new Map();

    public setAllSourceUrls(sourceUrls: string[]): void {
        const paths: ParsedPath[] = sourceUrls.map(parse);
        this.baseToRemoteUrl.clear();
        paths.forEach(path => {
            this.baseToRemoteUrl.set(path.base, path.dir + sep + path.base);
        });
    }

    public remoteSourceUrl(localUrl: string): string {
        const path = parse(localUrl);
        if (this.baseToRemoteUrl.has(path.base)) {
            return this.baseToRemoteUrl.get(path.base);
        }
        // Fallback
        return localUrl;
    }
}