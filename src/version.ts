import * as fs from 'fs';


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


let extensionVersion: Version;
let extensionPath: string | undefined;
export function setExtensionPath(path: string) {
    extensionPath = path;
}
export function getVersion(): Version {
    if (extensionVersion) {
        return extensionVersion;
    } else {
        if (extensionPath !== undefined) {
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
