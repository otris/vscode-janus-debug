import * as path from 'path';
import {versionMapping} from '../portalscript/versions/versionMapping';

// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');
// tslint:disable-next-line:no-var-requires
const execSync = require('child_process').execSync;

const PORTALSCRIPTING = 'portalScripting';


/**
 * Return the corresponding version to the build number
 * given in buildVer if there is any. If no version exists
 * to this build number, the build number itself is returned.
 *
 * @param buildVer build number of the documents server
 */
export function getExactVersion(buildVer: string): string {
    const buildNo = buildVer.replace('#', '');

    const keys = Object.keys(versionMapping);
    if (keys && keys.indexOf(buildNo) >= 0) {
        return (versionMapping as any)[buildNo];
    }

    return buildNo;
}


/**
 * Return the latest version that is lower than the
 * given build number.
 *
 * @param buildVer build number of the documents server
 */
export function getVersion(buildVer: string): string {
    let buildNo = buildVer.replace('#', '');
    const numberCheck = parseInt(buildNo, 10);
    if (isNaN(numberCheck)) {
        return "";
    }
    buildNo = numberCheck.toString();

    const keys = Object.keys(versionMapping);
    keys.sort();
    if (keys && keys.indexOf(buildNo) >= 0) {
        return (versionMapping as any)[buildNo];
    } else if (buildNo > "8013") {
        let idx = keys.findIndex((k, i) => {
            if (buildNo < k) {
                return true;
            }
            return false;
        });
        if (idx === -1) {
            idx = keys.length;
        }
        return (versionMapping as any)[keys[idx - 1]];
    }

    return "";
}


/**
 * Check, if the given version is the current latest version.
 *
 * @param version version of documents server (e.g. 5.0b HF1)
 */
export function isLatestVersion(version: string): boolean {
    const keys = Object.keys(versionMapping);
    keys.sort();
    if (version === (versionMapping as any)[keys[keys.length - 1]]) {
        return true;
    }
    return false;
}


/**
 * Return the latest build numbert, that is available in
 * the extension.
 */
export function getLatestBuildNo(): string {
    const keys = Object.keys(versionMapping);
    keys.sort();
    return keys[keys.length - 1];
}


export function isVersion(version: string): boolean {
    const value = Object.keys(versionMapping).find((key) => {
        return (version === (versionMapping as any)[key]);
    });
    if (value) {
        return true;
    }
    return false;
}


/**
 * If a build number is given and if this is not the latest build of the documents server,
 * the function gets the corresponding server version and checks if the typings to this
 * version are already generated. If not, they will be generated.
 * The typings for the latest version don't have to be generated, because they are always
 * delivered with the extension.
 *
 * @param extensionPath absolute path to extension, in developer mode this is the workspace root
 * @param outputPath the path where all generated typings are stored
 * @param buildNo the build number of the documents server
 */
export function ensurePortalScriptingTSD(extensionPath: string, outputPath: string, version?: string): string {
    let output = path.join(outputPath, PORTALSCRIPTING + ".d.ts");

    if (!version || version === "" || !isVersion(version) || isLatestVersion(version)) {
        return output;
    }
    // if (!version) {
    //     return output;
    // }

    // version e.g. 5.0c HF1 -> 50chf1
    let versionPostfix = version.replace('.', '');
    versionPostfix = versionPostfix.replace(' ', '');
    versionPostfix = versionPostfix.toLocaleLowerCase();
    output = path.join(outputPath, PORTALSCRIPTING + "_" + versionPostfix + ".d.ts");

    if (fs.existsSync(output)) {
        return output;
    }

    // typings in that version do not exist, so generate them

    // create all required paths for jsdoc
    const jsdoc = path.join(extensionPath, 'node_modules', '.bin', "jsdoc");
    const input = path.join(extensionPath, 'portalscript', 'jsdoc', "portalScripting.js");
    const config = path.join(extensionPath, 'portalscript', 'jsdoc', 'jsdoc-config.json');
    const template = path.join(extensionPath, 'node_modules', '@otris', 'jsdoc-tsd', "src-out", "core");

    // create jdoc-config.json
    const configObject = {
        "latestVersion": "DOCUMENTS " + version,
        "versionComparator": path.join(extensionPath, 'portalscript', 'jsdoc', "versionComparator.js")
    };
    const configContent = JSON.stringify(configObject);
    fs.writeFileSync(config, configContent);

    // execute jsdoc
    const ret = execSync(jsdoc + " " + input + " -c " + config + " -t " + template + " -d " + output);

    // add fileTypeMapper and comment to typings
    try {
        const concat = path.join(extensionPath, 'portalscript', 'typings', "fileTypeMapper.d.ts");
        const comment = "// type definition file for portal scripting on DOCUMENTS " + version + "\n";
        const dtsFile = fs.readFileSync(output, 'utf8');
        const ftMapper = fs.readFileSync(concat, 'utf8');
        fs.writeFileSync(output, comment + "\n" + dtsFile + "\n" + ftMapper);
    } catch (err) {
        output = path.join(outputPath, PORTALSCRIPTING + ".d.ts");
    }

    return output;
}
