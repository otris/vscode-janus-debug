'use strict';

import { ParsedPath, parse, sep } from 'path';

export class SourceMap {
    private baseToRemoteUrl: Map<string, string> = new Map();

    public setAllSourceUrls(sourceUrls: string[]): void {
        this.baseToRemoteUrl.clear();
        sourceUrls.forEach(sourceUrl => {
            const parsedPath = parse(sourceUrl);
            this.baseToRemoteUrl.set(parsedPath.base, sourceUrl);
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