import * as path from 'path';
import {versionMapping} from '../portalscript/versions/versionMapping';

// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');
// tslint:disable-next-line:no-var-requires
const execSync = require('child_process').execSync;

const PORTALSCRIPTING = 'portalScripting';


export function getExactVersion(buildVer: string): string {
    const buildNo = buildVer.replace('#', '');

    const keys = Object.keys(versionMapping);
    if (keys && keys.indexOf(buildNo) >= 0) {
        return (versionMapping as any)[buildNo];
    }

    return buildNo;
}

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

export function isLatestVersion(version: string): boolean {
    const keys = Object.keys(versionMapping);
    keys.sort();
    if (version === (versionMapping as any)[keys[keys.length - 1]]) {
        return true;
    }
    return false;
}


export function ensurePortalScriptingTSD(extensionPath: string, outputPath: string, buildNo?: string): string {
    let output = path.join(outputPath, PORTALSCRIPTING + ".d.ts");
    const nodeModules = path.join(extensionPath, 'node_modules');
    const typingsPath = path.join(extensionPath, 'portalscript', 'typings');
    const jsdocPath = path.join(extensionPath, 'portalscript', 'jsdoc');

    let version;
    if (buildNo && buildNo !== "") {
        version = getVersion(buildNo);
        if (isLatestVersion(version)) {
            // latest version is default and should not be generated
            version = "";
        }
    }

    if (version && version !== '') {
        // version e.g. 5.0c HF1 -> 50chf1
        let versionPostfix = version.replace('.', '');
        versionPostfix = versionPostfix.replace(' ', '');
        versionPostfix = versionPostfix.toLocaleLowerCase();
        output = path.join(outputPath, PORTALSCRIPTING + "_" + versionPostfix + ".d.ts");

        if (!fs.existsSync(output)) {
            const jsdoc = path.join(nodeModules, '.bin', "jsdoc");
            const input = path.join(jsdocPath, "portalScripting.js");
            const concat = path.join(typingsPath, "fileTypeMapper.d.ts");
            const config = path.join(jsdocPath, 'jsdoc-config.json');
            const configObject = {
                "latestVersion": "DOCUMENTS " + version,
                "versionComparator": path.join(jsdocPath, "versionComparator.js")
            };
            const configContent = JSON.stringify(configObject);
            fs.writeFileSync(config, configContent);
            const template = path.join(nodeModules, '@otris', 'jsdoc-tsd', "src-out", "core");
            execSync(jsdoc + " " + input + " -c " + config + " -t " + template + " -d " + output);
            try {
                const comment = "// type definition file for portal scripting on DOCUMENTS " + version + "\n";
                const dtsFile = fs.readFileSync(output, 'utf8');
                const ftMapper = fs.readFileSync(concat, 'utf8');
                fs.writeFileSync(output, comment + "\n" + dtsFile + "\n" + ftMapper);
            } catch (err) {
                output = path.join(outputPath, PORTALSCRIPTING + ".d.ts");
            }
        }
    }

    return output;
}
