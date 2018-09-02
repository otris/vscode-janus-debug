/**
 * This file contains all functions that prepare the scripts-struct
 * before uploading/downloading it.
 *
 * The vscode module should not be imported here anymore, because
 * all the functions here should be tested with the mocha tests.
 *
 * ToDo:
 * * Create a type "configurations" with a member for any setting
 *   and for the used working folder.
 *   Settings and working folder must be read in "extension.ts" at
 *   the beginning of every command.
 * * Add tests!
 */


import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as helpers from './helpers';


// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

const invalidCharacters = /[\\\/:\*\?"<>\|]/;

const CATEGORY_FOLDER_POSTFIX = '.cat';


export function getCategoryFromPath(parampath?: string) {
    if (!parampath) {
        return undefined;
    }
    const dir = (path.extname(parampath) === ".js") ? path.dirname(parampath) : parampath;
    if (!dir.endsWith(CATEGORY_FOLDER_POSTFIX)) {
        return undefined;
    }
    const postfixPos = dir.lastIndexOf(CATEGORY_FOLDER_POSTFIX);
    return path.normalize(dir.slice(0, postfixPos)).split(path.sep).pop();
}


/**
 * @param serverInfo to be removed
 */
export function categoriesToFolders(confCategories: boolean, documentsVersion: string, scripts: nodeDoc.scriptT[], targetDir: string): string[] {

    if (confCategories !== true) {
        return [];
    }

    if (Number(documentsVersion) < Number(nodeDoc.VERSION_CATEGORIES)) {
        return [];
    }

    const invalidNames: string[] = [];
    const category = getCategoryFromPath(targetDir);
    if (category) {
        // the target folder is a category-folder
        // only save scripts from this category

        scripts.forEach((script: nodeDoc.scriptT) => {
            if (script.category === category) {
                script.path = path.join(targetDir, script.name + '.js');
            } else {
                script.path = "";
            }
        });
    } else {
        // the target folder is not a category-folder
        // create folders from categories

        scripts.forEach((script: nodeDoc.scriptT) => {
            if (script.category) {
                if (invalidCharacters.test(script.category)) {
                    path.parse(script.category);
                    script.path = "";
                    invalidNames.push(script.category);
                } else {
                    script.path = path.join(targetDir, script.category + CATEGORY_FOLDER_POSTFIX, script.name + '.js');
                }
            }
        });
    }

    return invalidNames;
}


/**
 * @param serverInfo to be removed
 */
export function foldersToCategories(confCategories: boolean, serverInfo: nodeDoc.ConnectionInformation, scripts: nodeDoc.scriptT[]) {

    if (confCategories !== true) {
        return;
    }

    if (Number(serverInfo.documentsVersion) < Number(nodeDoc.VERSION_CATEGORIES)) {
        return;
    }

    scripts.forEach((script: nodeDoc.scriptT) => {
        if (script.path) {
            script.category = getCategoryFromPath(script.path);
        }
    });
}






export function setScriptInfoJson(scriptParameters: boolean, workspaceFolder: string | undefined, scripts: nodeDoc.scriptT[]) {
    if (!scriptParameters) {
        return;
    }
    if (!workspaceFolder) {
        return;
    }
    // loginData.language = nodeDoc.Language.English;

    scripts.forEach((script) => {
        const infoFile = path.join(workspaceFolder, '.scriptParameters', script.name + '.json');
        try {
            script.parameters = fs.readFileSync(infoFile, 'utf8');
        } catch (err) {
            //
        }
    });
}

export function getScriptInfoJson(scriptParameters: boolean, scripts: nodeDoc.scriptT[]) {
    if (!scriptParameters) {
        return;
    }
    // loginData.language = nodeDoc.Language.English;

    scripts.forEach((script) => {
        script.downloadParameters = true;
    });
}

export async function writeScriptInfoJson(scriptParameters: boolean, workspaceFolder: string | undefined, scripts: nodeDoc.scriptT[]) {
    if (!scriptParameters) {
        return;
    }
    if (!workspaceFolder) {
        return;
    }
    scripts.forEach(async (script) => {
        if (script.parameters) {
            const parpath = path.join(workspaceFolder, '.scriptParameters', script.name + '.json');
            await nodeDoc.writeFileEnsureDir(script.parameters, parpath);
        }
    });
}


export function readEncryptionFlag(encryptOnUpload: boolean, encryptionOnUpload: string, pscripts: nodeDoc.scriptT[]) {
    if (encryptOnUpload) {
        pscripts.forEach((script) => {
            script.encrypted = 'decrypted';
        });
    } else if (encryptionOnUpload) {
        switch (encryptionOnUpload) {
            case "always":
                pscripts.forEach((script) => {
                    script.encrypted = 'decrypted';
                });
                break;

            case "never":
                pscripts.forEach((script) => {
                    script.encrypted = 'forceFalse';
                });
                break;

            case "default":
            default:
                pscripts.forEach((script) => {
                    script.encrypted = 'false';
                });
                break;
            }
    } else {
        pscripts.forEach((script) => {
            script.encrypted = 'false';
        });
    }
}



export function setConflictModes(forceUpload: boolean, pscripts: nodeDoc.scriptT[]) {

    if (!forceUpload) {
        return;
    }

    // read values
    pscripts.forEach((script) => {
        script.conflictMode = false;
    });
}

/**
 * Reads the conflict mode and hash value of any script in pscripts.
 */
export function readHashValues(forceUpload: boolean, workspaceFolder: string | undefined, pscripts: nodeDoc.scriptT[], server: string) {
    if (0 === pscripts.length) {
        return;
    }
    if (!workspaceFolder) {
        return;
    }

    // when forceUpload is true, this function is unnecessary
    if (forceUpload) {
        return;
    }

    // filename of cache file CACHE_FILE
    const hashValueFile = path.join(workspaceFolder, helpers.CACHE_FILE);

    // get hash values from file as array
    let hashValues: string[];
    try {
        hashValues = fs.readFileSync(hashValueFile, 'utf8').trim().split('\n');
    } catch (err) {
        if (err.code === 'ENOENT') {
            hashValues = [];
            fs.writeFileSync(hashValueFile, '');
        } else {
            return;
        }
    }


    // read hash values of scripts in conflict mode
    pscripts.forEach((script) => {
        hashValues.forEach((value, idx) => {
            const scriptpart = value.split(':')[0];
            const scriptAtServer = script.name + '@' + server;

            if (scriptpart === scriptAtServer) {
                script.lastSyncHash = hashValues[idx].split(':')[1];
            }
        });
    });
}

export function updateHashValues(forceUpload: boolean, workspaceFolder: string | undefined, pscripts: nodeDoc.scriptT[], server: string) {
    if (0 === pscripts.length) {
        return;
    }
    if (!workspaceFolder) {
        return;
    }

    if (forceUpload) {
        return;
    }

    // filename of cache file CACHE_FILE
    const hashValueFile = path.join(workspaceFolder, helpers.CACHE_FILE);

    let hashValues: string[];
    try {
        // get hash values from file as array
        hashValues = fs.readFileSync(hashValueFile, 'utf8').trim().split('\n');
    } catch (err) {
        if (err.code === 'ENOENT') {
            hashValues = [];
            fs.writeFileSync(hashValueFile, '');
        } else {
            return;
        }
    }

    // set hash values of scripts in conflict mode
    pscripts.forEach((script) => {

        const scriptAtServer = script.name + '@' + server;
        const entry = scriptAtServer + ':' + script.lastSyncHash;

        // search entry
        let updated = false;
        hashValues.forEach((value, idx) => {
            const scriptpart = value.split(':')[0];
            if (scriptpart === scriptAtServer) {
                hashValues[idx] = entry;
                updated = true;
            }
        });

        // create new entry
        if (!updated) {
            hashValues.push(entry);
        }
    });

    // write to CACHE_FILE
    const hashValStr = hashValues.join('\n').trim();
    fs.writeFileSync(hashValueFile, hashValStr);
}

interface ScriptLog {
    returnValue: string;
    append: boolean;
    fileName: string;
}

export function scriptLog(scriptLog: ScriptLog | undefined, workspaceFolder: string | undefined, scriptOutput: string | undefined) {
    if (!scriptOutput || 0 >= scriptOutput.length) {
        return;
    }

    if (!scriptLog || !scriptLog.returnValue) {
        return;
    }
    let returnValue = '';
    const lines = scriptOutput.replace('\r', '').split('\n');
    lines.forEach(function(line) {
        if (line.startsWith('Return-Value: ')) {
            returnValue = line.substr(14) + os.EOL;
        }
    });
    if (returnValue.length > 0 && scriptLog.fileName && workspaceFolder) {
        const fileName = scriptLog.fileName.replace(/[$]{workspaceRoot}/, workspaceFolder);
        if (!scriptLog.append) {
            fs.writeFileSync(fileName, returnValue, {flag: "a"});
        } else {
            fs.writeFileSync(fileName, returnValue);
        }
    }
}
