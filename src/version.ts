import * as fs from 'fs';
import * as vscode from 'vscode';

export let extensionVersion: Version;

export class Version {

    public static developmentVersion(): Version {
        return new Version("", "", "", "");
    }

    constructor(public major: string, public minor: string, public patch: string, public commit: string) { }

    public toString(includeCommit = false): string {
        if (!this.major) {
            return "devel";
        } else {
            const returnString = this.major + "." + this.minor + "." + this.patch;
            if (includeCommit) {
                return returnString + " (" + this.commit + ")";
            }
            return returnString;
        }
    }
}

export function getVersion(): Version {
    if (extensionVersion) {
        return extensionVersion;
    } else {
        // get location fo the extensions source folder
        const thisExtension: vscode.Extension<any> | undefined = vscode.extensions.getExtension("otris-software.vscode-janus-debug");
        if (thisExtension !== undefined) {
            const extensionPath: string = thisExtension.extensionPath;

            try {
                const data = fs.readFileSync(extensionPath + "/out/src/version.json", { encoding: "utf-8", flag: "r" });
                const obj = JSON.parse(data);
                extensionVersion = new Version(obj.major, obj.minor, obj.patch, obj.commit);
                return extensionVersion;
            } catch (err) {
                if (err.code === 'ENOENT') {
                    return Version.developmentVersion();
                }
                throw new Error(err);
            }
        }
        return Version.developmentVersion();
    }
}
