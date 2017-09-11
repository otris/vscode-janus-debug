'use strict';

import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as helpers from './helpers';
import * as login from './login';
import stripJsonComments = require('strip-json-comments');

// tslint:disable-next-line:no-var-requires
const tsc = require('typescript-compiler');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

const VERSION_SCRIPT_PARAMS = '8035';
const VERSION_DECRYPT_PERM = '8040';

export let decrptionVersionChecked: boolean;

export function setDecryptionVersionChecked(value: boolean) {
    decrptionVersionChecked = value;
}

/**
 * Returns false if user has decryption permission and server version is not 5.0c or higher.
 * Because then the upload with encrypted scripts will cause problems.
 */
export async function checkDecryptionVersion(loginData: nodeDoc.ConnectionInformation): Promise<void> {
    await login.ensureLoginInformation(loginData);

    return new Promise<void>((resolve, reject) => {
        if (!decrptionVersionChecked) {
            nodeDoc.serverSession(loginData, [], nodeDoc.checkDecryptionPermission).then((retval1) => {
                const perm: nodeDoc.documentsT = retval1[0];
                decrptionVersionChecked = true;
                if (perm && Number(loginData.documentsVersion) < Number(VERSION_DECRYPT_PERM)) {
                    const info = `Please update your DOCUMENTS to 5.0c (#${VERSION_DECRYPT_PERM}) to avoid problems with encrypted scripts`;
                    vscode.window.showQuickPick(['Upload anyway', 'Cancel'], { placeHolder: info }).then((answer) => {
                        if ('Upload anyway' === answer) {
                            resolve();
                        } else {
                            reject();
                        }
                    });
                } else {
                    resolve();
                }
            }).catch((reason) => {
                reject('checkDecryptionVersion failed ' + reason);
            });
        } else {
            resolve();
        }
    });

}




/**
 * Common function for uploading script.
 * TODO merge with uploadScript
 *
 * @param loginData
 * @param param
 */
async function uploadScriptCommon(loginData: nodeDoc.ConnectionInformation, param: any): Promise<string> {
    await login.ensureLoginInformation(loginData);

    return new Promise<string>((resolve, reject) => {
        helpers.ensureScript(param).then((_script) => {

            // get information from settings and hash values
            helpers.readHashValues([_script], loginData.server);
            helpers.readEncryptionFlag([_script]);
            // helpers.setCategories([_script]);

            return nodeDoc.serverSession(loginData, [_script], nodeDoc.uploadScript).then((value) => {

                // in case of conflict (server-script changed by someone else)
                // returned script contains local and server code
                // otherwise returned script == input script
                const script: nodeDoc.scriptT = value[0];

                // in case of conflict, ask if script should be force-uploaded
                helpers.ensureForceUpload([script]).then(([noConflict, forceUpload]) => {

                    // if forceUpload is empty function resolves anyway
                    nodeDoc.serverSession(loginData, forceUpload, nodeDoc.uploadScript).then(() => {

                        // if script had conflict and was not force-uploaded
                        // conflict is true in this script
                        if (true !== script.conflict) {
                            helpers.updateHashValues([script], loginData.server);
                            resolve(script.name);
                        }
                    }).catch((reason) => {
                        reject('force upload ' + script.name + ' failed: ' + reason);
                    });
                }); // no reject in upload scripts

            });
        }).catch((reason) => {
            reject('upload script failed: ' + reason);
        });
    });
}

/**
 * Upload script
 */
export function uploadScript(loginData: nodeDoc.ConnectionInformation, param: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        uploadScriptCommon(loginData, param).then((scriptName) => {
            vscode.window.setStatusBarMessage('uploaded: ' + scriptName);
            resolve();
        }).catch((reason) => {
            vscode.window.showErrorMessage(reason);
            reject();
        });
    });
}

/**
 * Upload script on save
 */
export function uploadScriptOnSave(loginData: nodeDoc.ConnectionInformation, fileName: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        helpers.ensureUploadOnSave(fileName).then((value) => {
            if (helpers.autoUploadAnswer.yes === value) {

                uploadScriptCommon(loginData, fileName).then((scriptName) => {
                    vscode.window.setStatusBarMessage('uploaded: ' + scriptName);
                }).catch((reason) => {
                    vscode.window.showErrorMessage(reason);
                });
                resolve(true);
            } else if (helpers.autoUploadAnswer.never === value) {
                resolve(false);
            } else {
                resolve(true);
            }
        }).catch((reason) => {
            vscode.window.showErrorMessage('upload script failed: ' + reason);
            reject();
        });
    });
}

export function uploadJSFromTS(loginData: nodeDoc.ConnectionInformation, textDocument: vscode.TextDocument): Promise<void> {
    return new Promise<void>((resolve, reject) => {

        if (!textDocument || '.ts' !== path.extname(textDocument.fileName)) {
            vscode.window.showErrorMessage('No active TypeScript file');
            resolve();
        } else {

            const tsname: string = textDocument.fileName;
            const jsname: string = tsname.substr(0, tsname.length - 3) + ".js";
            const tscargs = ['-t', 'ES5', '--out', jsname];
            const retval = tsc.compile([textDocument.fileName], tscargs);
            const scriptSource = retval.sources[jsname];
            if (scriptSource) {
                console.log("scriptSource:\n" + scriptSource);
            }

            uploadScriptCommon(loginData, jsname).then((scriptname) => {
                vscode.window.setStatusBarMessage('uploaded: ' + scriptname);
                resolve();
            }).catch((reason) => {
                vscode.window.showErrorMessage(reason);
                resolve();
            });
        }
    });
}


/**
 * Upload and run script
 */
export function uploadRunScript(loginData: nodeDoc.ConnectionInformation, param: any, runScriptChannel: vscode.OutputChannel) {
    uploadScriptCommon(loginData, param).then((scriptName) => {

        let script: nodeDoc.scriptT = new nodeDoc.scriptT(scriptName);
        return nodeDoc.serverSession(loginData, [script], nodeDoc.runScript).then((value) => {
            script = value[0];
            runScriptChannel.append(script.output + os.EOL);
            runScriptChannel.show();
        });

    }).catch((reason) => {
        vscode.window.showErrorMessage(reason);
    });
}

/**
 * Upload all
 */
export async function uploadAll(loginData: nodeDoc.ConnectionInformation, _param: any) {
    await login.ensureLoginInformation(loginData);

    helpers.ensurePath(_param).then((folder) => {

        // get all scripts from folder and subfolders and read information
        // from .vscode\settings.json
        const folderScripts = nodeDoc.getScriptsFromFolderSync(folder[0]);
        helpers.readHashValues(folderScripts, loginData.server);
        helpers.readEncryptionFlag(folderScripts);
        // helpers.setCategories(folderScripts);

        return nodeDoc.serverSession(loginData, folderScripts, nodeDoc.uploadAll).then((value1) => {
            const retScripts: nodeDoc.scriptT[] = value1;

            // ask user about how to handle conflict scripts
            helpers.ensureForceUpload(retScripts).then(([noConflict, forceUpload]) => {

                // forceUpload might be empty, function resolves anyway
                nodeDoc.serverSession(loginData, forceUpload, nodeDoc.uploadAll).then((value2) => {
                    const retScripts2: nodeDoc.scriptT[] = value2;

                    // retscripts2 might be empty
                    const uploaded = noConflict.concat(retScripts2);

                    helpers.updateHashValues(uploaded, loginData.server);

                    vscode.window.setStatusBarMessage('uploaded ' + uploaded.length + ' scripts from ' + folder[0]);
                }).catch((reason) => {
                    vscode.window.showErrorMessage('force upload of conflict scripts failed: ' + reason);
                });
            });
        });

    }).catch((reason) => {
        vscode.window.showErrorMessage('upload all failed: ' + reason);
    });
}

/**
 * Download script
 *
 * @param contextMenuPath: If command is called from context menu, this variable should
 * contain the corresponding path. Otherwise it should be undefined.
 */
export async function downloadScript(loginData: nodeDoc.ConnectionInformation, contextMenuPath: string | undefined) {
    await login.ensureLoginInformation(loginData);

    helpers.ensureScriptName(contextMenuPath).then((scriptName) => {
        return helpers.ensurePath(contextMenuPath, true).then((scriptInfo) => {
            const scriptDir: string = scriptInfo[0];
            let script: nodeDoc.scriptT = new nodeDoc.scriptT(scriptName, scriptDir);

            helpers.readConflictModes([script]);
            helpers.setCategoryRoots([script], contextMenuPath, scriptDir);

            return nodeDoc.serverSession(loginData, [script], nodeDoc.downloadScript).then((value) => {
                script = value[0];
                helpers.updateHashValues([script], loginData.server);
                vscode.window.setStatusBarMessage('downloaded: ' + script.name);
            });
        });
    }).catch((reason) => {
        vscode.window.showErrorMessage('download script failed: ' + reason);
    });
}

/**
 * Download all
 */
export async function downloadAll(loginData: nodeDoc.ConnectionInformation, contextMenuPath: string | undefined) {
    await login.ensureLoginInformation(loginData);

    helpers.ensurePath(contextMenuPath, true).then((scriptInfo) => {
        const scriptDir: string = scriptInfo[0];

        // get names of scripts that should be downloaded
        return getDownloadScriptNames(loginData).then((requestScripts) => {

            // set download path to scripts
            requestScripts.forEach(function(script) {
                script.path = scriptDir;
            });

            helpers.readConflictModes(requestScripts);
            helpers.setCategoryRoots(requestScripts, contextMenuPath, scriptDir);

            // download scripts
            return nodeDoc.serverSession(loginData, requestScripts, nodeDoc.downloadAll).then((scripts) => {
                helpers.updateHashValues(scripts, loginData.server);
                // if a script from input list has not been downloaded but the function was resolved
                // then the script is encrypted on server
                const encryptedScripts = requestScripts.length - scripts.length;
                if (1 === encryptedScripts) {
                    vscode.window.showWarningMessage(`1 encrypted script has not been downloaded`);
                } else if (1 < encryptedScripts) {
                    vscode.window.showWarningMessage(`${encryptedScripts} encrypted scripts have not been downloaded`);
                }
                vscode.window.setStatusBarMessage(`downloaded ${scripts.length} scripts`);
            });
        });
    }).catch((reason) => {
        vscode.window.showErrorMessage('download all failed: ' + reason);
    });
}

/**
 * Run script
 */
export async function runScript(loginData: nodeDoc.ConnectionInformation, param: any, runScriptChannel: vscode.OutputChannel) {
    await login.ensureLoginInformation(loginData);

    helpers.ensureScriptName(param).then((scriptname) => {
        let script: nodeDoc.scriptT = new nodeDoc.scriptT(scriptname);
        return nodeDoc.serverSession(loginData, [script], nodeDoc.runScript).then((value) => {
            script = value[0];
            runScriptChannel.append(script.output + os.EOL);
            runScriptChannel.show();
        });
    }).catch((reason) => {
        vscode.window.showErrorMessage('run script failed: ' + reason);
    });
}

/**
 * Compare script
 */
export async function compareScript(loginData: nodeDoc.ConnectionInformation, _param: any) {
    await login.ensureLoginInformation(loginData);

    helpers.ensurePath(_param, false, true).then((_path) => {
        const scriptFolder = _path[0];
        const _scriptname = _path[1];
        return helpers.ensureScriptName(_scriptname).then((scriptname) => {
            let comparePath: string;
            if (vscode.workspace && vscode.workspace.rootPath) {
                comparePath = path.join(vscode.workspace.rootPath, helpers.COMPARE_FOLDER);
            } else {
                comparePath = path.join(scriptFolder, helpers.COMPARE_FOLDER);
            }
            return helpers.createFolder(comparePath, true).then(() => {
                let script: nodeDoc.scriptT = new nodeDoc.scriptT(scriptname, comparePath, '', helpers.COMPARE_FILE_PREFIX + scriptname);
                return nodeDoc.serverSession(loginData, [script], nodeDoc.downloadScript).then((value) => {
                    script = value[0];
                    helpers.compareScript(scriptFolder, scriptname);
                });
            });
        });
    }).catch((reason) => {
        vscode.window.showErrorMessage('compare script failed: ' + reason);
    });
}

/**
 * Download script names
 */
export function getScriptnames(loginData: nodeDoc.ConnectionInformation, param: any) {
    nodeDoc.serverSession(loginData, [], nodeDoc.getScriptNamesFromServer).then((_scripts) => {
        helpers.writeScriptNamesToFile(_scripts);
        console.log('Wrote scripts to file and opened the file');
    }).catch((reason) => {
        vscode.window.showErrorMessage('get scriptnames failed: ' + reason);
    });
}

/**
 * Download script parameters
 */
export async function getScriptParameters(loginData: nodeDoc.ConnectionInformation, param: any) {
    await login.ensureLoginInformation(loginData);

    // Check documents version
    nodeDoc.serverSession(loginData, [], nodeDoc.getDocumentsVersion).then((value) => {
        const doc: nodeDoc.documentsT = value[0];
        if (!doc) {
            vscode.window.showErrorMessage(`get script parameters: get DOCUMENTS version failed`);
        } else if (doc.version && (Number(VERSION_SCRIPT_PARAMS) > Number(doc.version))) {
            const errmsg = `Get Script Parameters: required DOCUMENTS version is ${VERSION_SCRIPT_PARAMS}, you are using ${doc.version}`;
            vscode.window.showErrorMessage(errmsg);
        } else {
            // get names of all scripts in script array
            // return nodeDoc.sdsSession(loginData, [], nodeDoc.getScriptNamesFromServer).then((_scripts) => {

            // get names of download scripts
            return getDownloadScriptNames(loginData).then((_scripts) => {

                // get parameters
                return nodeDoc.serverSession(loginData, _scripts, nodeDoc.getAllParameters).then((values) => {
                    if (1 < values.length) {
                        const scriptsObject: any = {};
                        for (let idx = 0; idx < values.length; idx += 2) {
                            const scriptName = values[idx + 0];
                            const scriptJson = values[idx + 1];
                            const jsonObject = JSON.parse(stripJsonComments(scriptJson));
                            scriptsObject[scriptName] = {
                                attributes: jsonObject[scriptName].attributes,
                                parameters: jsonObject[scriptName].parameters
                            };
                        }
                        const jsonOutput = JSON.stringify(scriptsObject, null, '\t').split('\n').map(line => '\t' + line).join('\n').trim();
                        // save json to workspace or write it to console
                        if (vscode.workspace && vscode.workspace.rootPath) {
                            const jsonfilename = 'jscript.specs.json';
                            const jsonfilepath = path.join(vscode.workspace.rootPath, jsonfilename);
                            return nodeDoc.writeFile(jsonOutput, jsonfilepath).then(() => {
                                vscode.window.setStatusBarMessage('wrote script parameters to ' + jsonfilename);
                            });
                        } else {
                            console.log(jsonOutput);
                        }
                    } else {
                        console.log('get script parameters failed: array.length: ' + value.length);
                    }
                });
            });
        }
    }).catch((error) => {
        vscode.window.showErrorMessage('get script parameters failed: ' + error);
    });
}


// TODO: Remove this function
async function getDownloadScriptNames(loginData: nodeDoc.ConnectionInformation): Promise<nodeDoc.scriptT[]> {
    return new Promise<nodeDoc.scriptT[]>((resolve, reject) => {

        const scripts: nodeDoc.scriptT[] = helpers.getDownloadScriptNamesFromList();
        if (0 < scripts.length) {
            return resolve(scripts);
        }

        nodeDoc.serverSession(loginData, [], nodeDoc.getScriptNamesFromServer).then((serverScripts) => {
            resolve(serverScripts);
        }).catch((reason) => {
            reject(reason);
        });
    });
}
