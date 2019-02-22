import * as fs from 'fs';
import { Logger } from 'node-file-log';
import { parse } from 'path';



export interface LocalPaths {
    name: string;
    path: string | undefined;
    paths: string[];
}

export interface LocalSourcesPattern {
    include: string;
    exclude: string;
}


const localSourceLog = Logger.create('SourceMap');


/**
 * A local source file.
 */
export class LocalSource {
    /** The name of this source. Usually a file name. */
    public readonly name: string;
    /** The local absolute path to this source. */
    public path: string;
    public paths?: string[];
    /** An array of possible alias names. */
    public aliasNames: string[];
    /** An artificial key that iff > 0 is used by VS Code to retrieve the source through the SourceRequest. */
    public sourceReference: number;

    constructor(path: string, paths?: string[]) {
        const parsedPath = parse(path);
        this.path = path;
        this.name = parsedPath.base;
        this.aliasNames = [
            parsedPath.name,
            parsedPath.base
        ];
        this.sourceReference = 0;
        if (paths && paths.length > 0) {
            this.paths = paths;
            localSourceLog.info(`Additional paths found ${JSON.stringify(this.paths)}`);
        }
    }

    public loadFromDisk(): string {
        return fs.readFileSync(this.path, 'utf8');
    }

    public getSourceLine(lineNo: number): string {
        const fileContents = this.loadFromDisk();
        const lines = fileContents.split("\n");
        const ret = lines[lineNo - 1];
        if (ret === undefined) {
            throw new Error(`Line ${lineNo} does not exist in ${this.name}`);
        }
        return ret.trim();
    }

    public leadingDebuggerStmts(): number {
        let counter = 0;
        const fileContents = this.loadFromDisk();
        const lines = fileContents.split("\n");
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

    public sourceName(): string {
        return parse(this.path).name;
    }
}

