import * as fs from 'fs';
import * as vscode from 'vscode';

export class Version {

    public static developmentVersion(): Version {
        return new Version("", "", "", "");
    }

    constructor(public major: string, public minor: string, public patch: string, public commit: string) { }

    public toString(): string {
        if (!this.major) {
            return "devel";
        } else {
            return this.major + "." + this.minor + "." + this.patch + " (" + this.commit + ")";
        }
    }
}

export async function getVersion(): Promise<Version> {
    return new Promise<Version>((resolve, reject) => {
        // get location fo the extensions source folder
        const thisExtension: vscode.Extension<any> | undefined = vscode.extensions.getExtension("otris-software.vscode-janus-debug");
        if (thisExtension !== undefined) {
            const extensionPath: string = thisExtension.extensionPath;
            fs.readFile(extensionPath + "/out/src/version.json", { encoding: "utf-8", flag: "r" }, (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        return resolve(Version.developmentVersion());
                    }
                    return reject(err);
                } else {
                    const obj = JSON.parse(data);
                    return resolve(new Version(obj.major, obj.minor, obj.patch, obj.commit));
                }
            });
        } else {
            return resolve(Version.developmentVersion());
        }
    }
    );

}
