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
 * If user has decryption permission and server version is not 5.0c or higher,
 * warn and ask user before upload.
 * Because then the upload with encrypted scripts will cause problems.
 */
export async function checkDecryptionVersion(loginData: nodeDoc.ConnectionInformation): Promise<void> {
    await login.ensureLoginInformation(loginData);

    return new Promise<void>((resolve, reject) => {
        if (!decrptionVersionChecked) {
            nodeDoc.serverSession(loginData, [], nodeDoc.checkDecryptionPermission).then(() => {
                decrptionVersionChecked = true;
                if (loginData.decryptionPermission && Number(loginData.documentsVersion) < Number(VERSION_DECRYPT_PERM)) {
                    const info = `You should update your DOCUMENTS to 5.0c (#${VERSION_DECRYPT_PERM}) to avoid problems with encrypted scripts`;
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
                vscode.window.showErrorMessage(reason.message);
                reject();
            });
        } else {
            resolve();
        }
    });

}


function getTime(): string {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const hours2 = hours < 10 ? '0' + hours : hours;
    const minutes2 = minutes < 10 ? '0' + minutes : minutes;
    const seconds2 = seconds < 10 ? '0' + seconds : seconds;
    return `${hours2}:${minutes2}:${seconds2}`;
}



/**
 * Common function for uploading script.
 * TODO merge with uploadScript
 *
 * @param loginData
 * @param param
 */
async function uploadScriptCommon(loginData: nodeDoc.ConnectionInformation, param: any): Promise<void> {
    await login.ensureLoginInformation(loginData);

    return new Promise<void>((resolve, reject) => {
        helpers.ensureScript(param).then((_script) => {

            // get information from settings and hash values
            helpers.setConflictModes([_script]);
            helpers.readHashValues([_script], loginData.server);
            helpers.readEncryptionFlag([_script]);
            helpers.setScriptInfoJson([_script]);
            // helpers.setCategories([_script]);

            return nodeDoc.serverSession(loginData, [_script], nodeDoc.uploadScript).then((value) => {

                // in case of conflict (server-script changed by someone else)
                // returned script contains local and server code
                // otherwise returned script == input script
                const script: nodeDoc.scriptT = value[0];

                // in case of conflict, ask if script should be force-uploaded
                helpers.ensureForceUpload([script]).then(([noConflict, forceUpload]) => {

                    // if forceUpload is empty, function resolves
                    nodeDoc.serverSession(loginData, forceUpload, nodeDoc.uploadScript).then(() => {
                        helpers.updateHashValues([script], loginData.server);

                        // script not uploaded, if conflict is true
                        if (script.conflict === true) {
                            return resolve();
                        }

                        vscode.window.setStatusBarMessage(`uploaded ${script.name} at ` + getTime());
                        return resolve();
                    }).catch((reason) => {
                        vscode.window.showErrorMessage('force upload ' + script.name + ' failed: ' + reason);
                        reject();
                    });
                });

            });
        }).catch((reason) => {
            vscode.window.showErrorMessage('upload script failed: ' + reason);
            reject();
        });
    });
}



/**
 * Upload script
 */
export function uploadScript(loginData: nodeDoc.ConnectionInformation, param: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        uploadScriptCommon(loginData, param).then(() => {
            resolve();
        }).catch((reason) => {
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

            if (helpers.autoUpload.yes === value) {
                uploadScriptCommon(loginData, fileName).then(() => {
                    resolve(true);
                }).catch((reason) => {
                    reject();
                });
            } else if (helpers.autoUpload.no === value) {
                resolve(true);
            } else if (helpers.autoUpload.neverAsk === value) {
                resolve(false);
            }
        }).catch((reason) => {
            reject();
        });
    });
}

export function uploadJSFromTS(loginData: nodeDoc.ConnectionInformation, textDocument: vscode.TextDocument): Promise<void> {
    return new Promise<void>((resolve, reject) => {

        if (!textDocument || '.ts' !== path.extname(textDocument.fileName)) {
            vscode.window.showErrorMessage('No active TypeScript file');
            return resolve();
        }

        const tsname: string = textDocument.fileName;
        const jsname: string = tsname.substr(0, tsname.length - 3) + ".js";
        const tscargs = ['-t', 'ES5', '--out', jsname];
        const retval = tsc.compile([textDocument.fileName], tscargs);
        const scriptSource = retval.sources[jsname];
        if (scriptSource) {
            console.log("scriptSource:\n" + scriptSource);
        }

        uploadScriptCommon(loginData, jsname).then(() => {
            resolve();
        }).catch((reason) => {
            reject();
        });

    });
}

/**
 * Upload all
 */
export function uploadAll(loginData: nodeDoc.ConnectionInformation, paramPath: any): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await login.ensureLoginInformation(loginData);
        } catch (reason) {
            return reject(reason);
        }

        helpers.ensurePath(paramPath).then((folder) => {

            const folderScripts = nodeDoc.getScriptsFromFolderSync(folder);
            helpers.setConflictModes(folderScripts);
            helpers.readHashValues(folderScripts, loginData.server);
            helpers.readEncryptionFlag(folderScripts);
            helpers.setScriptInfoJson(folderScripts);
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

                        vscode.window.setStatusBarMessage('uploaded ' + uploaded.length + ' scripts from ' + folder);
                        resolve();
                    }).catch((reason) => {
                        vscode.window.showErrorMessage('force upload of conflict scripts failed: ' + reason);
                        reject();
                    });
                });
            });

        }).catch((reason) => {
            vscode.window.showErrorMessage('upload all failed: ' + reason);
            reject();
        });
    });
}


function runScriptCommon(loginData: nodeDoc.ConnectionInformation, param: any, outputChannel: vscode.OutputChannel): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {

        try {
            await login.ensureLoginInformation(loginData);
            const serverScriptNames = await getServerScriptNames(loginData);
            const scriptName = await helpers.ensureScriptName(param, serverScriptNames);
            const script = new nodeDoc.scriptT(scriptName, '');

            outputChannel.append('Run script:' + os.EOL);
            outputChannel.show();

            await nodeDoc.serverSession(loginData, [script], nodeDoc.runScript);

            outputChannel.append(script.output + os.EOL);
            outputChannel.append(`Run script finished on DOCUMENTS #${loginData.documentsVersion}` + os.EOL);
            outputChannel.show();

            helpers.scriptLog(script.output);

            resolve(scriptName);
        } catch (reason) {
            return reject(reason);
        }
    });
}


/**
 * Run script
 */
export async function runScript(loginData: nodeDoc.ConnectionInformation, param: any, outputChannel: vscode.OutputChannel): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        let scriptName;

        try {
            scriptName = await runScriptCommon(loginData, param, outputChannel);
        } catch (reason) {
            vscode.window.showErrorMessage('run script failed: ' + reason);
            return reject();
        }

        vscode.window.setStatusBarMessage('run: ' + scriptName);
        resolve();
    });
}


/**
 * Upload and run script
 */
export function uploadRunScript(loginData: nodeDoc.ConnectionInformation, param: any, outputChannel: vscode.OutputChannel): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        let scriptName;

        try {
            scriptName = await uploadScriptCommon(loginData, param);
        } catch (reason) {
            return reject();
        }

        try {
            scriptName = await runScriptCommon(loginData, param, outputChannel);
        } catch (reason) {
            vscode.window.showErrorMessage('run script failed: ' + reason);
            return reject();
        }

        vscode.window.setStatusBarMessage('uploaded and run: ' + scriptName);
        resolve();
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

    const serverScriptNames = await getServerScriptNames(loginData);

    helpers.ensureScriptName(contextMenuPath, serverScriptNames).then((scriptName) => {
        return helpers.ensurePath(contextMenuPath, true).then((scriptDir) => {
            const scriptPath = path.join(scriptDir, scriptName + '.js');
            let script: nodeDoc.scriptT = new nodeDoc.scriptT(scriptName, scriptPath);

            helpers.getScriptInfoJson([script]);

            return nodeDoc.serverSession(loginData, [script], nodeDoc.downloadScript).then((value) => {
                script = value[0];

                // TODO: ask user if folder from category (script.category) should be created

                return nodeDoc.saveScriptUpdateSyncHash([script]).then(() => {
                    helpers.updateHashValues([script], loginData.server);
                    helpers.writeScriptInfoJson([script]);
                    vscode.window.setStatusBarMessage('downloaded: ' + script.name);
                });
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

    helpers.ensurePath(contextMenuPath, true).then((scriptDir) => {

        // get names of scripts that should be downloaded
        return getSelectedScriptNames(loginData).then((requestScripts) => {

            // set download path to scripts
            requestScripts.forEach(function(script) {
                script.path = path.join(scriptDir, script.name + '.js');
            });

            helpers.getScriptInfoJson(requestScripts);

            // download scripts
            return nodeDoc.serverSession(loginData, requestScripts, nodeDoc.downloadAll).then((scripts) => {

                // TODO: ask user if folder from category (script.category) should be created

                return nodeDoc.saveScriptUpdateSyncHash(scripts).then(() => {
                    helpers.updateHashValues(scripts, loginData.server);
                    helpers.writeScriptInfoJson(scripts);
                    // if a script from input list has not been downloaded but the function was resolved
                    // then the script is encrypted on server
                    const encryptedScripts = requestScripts.length - scripts.length;
                    if (1 === encryptedScripts) {
                        vscode.window.showWarningMessage(`couldn't download 1 script (it might be encrypted)`);
                    } else if (1 < encryptedScripts) {
                        vscode.window.showWarningMessage(`couldn't download ${encryptedScripts} scripts (they might be encrypted)`);
                    }
                    vscode.window.setStatusBarMessage(`downloaded ${scripts.length} scripts`);
                });
            });
        });
    }).catch((reason) => {
        vscode.window.showErrorMessage('download all failed: ' + reason);
    });
}


/**
 * Compare script
 */
export async function compareScript(loginData: nodeDoc.ConnectionInformation, contextMenuPath: any): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {

        let compareDir: string;
        if (vscode.workspace && vscode.workspace.rootPath) {
            compareDir = path.join(vscode.workspace.rootPath, helpers.COMPARE_FOLDER);
        } else {
            return reject('First create workspace folder please');
        }

        try {
            await login.ensureLoginInformation(loginData);
            await helpers.ensureHiddenFolder(compareDir);
        } catch (error) {
            return reject(error);
        }

        helpers.ensureScript(contextMenuPath).then((serverScript) => {
            return nodeDoc.serverSession(loginData, [serverScript], nodeDoc.downloadScript).then((value) => {

                try {
                    const compareScriptPath = path.join(compareDir, helpers.COMPARE_FILE_PREFIX + serverScript.name + '.js');
                    fs.writeFileSync(compareScriptPath, serverScript.serverCode);
                    const title = serverScript.name + '.js' + ' (DOCUMENTS Server)';
                    const lefturi = vscode.Uri.file(compareScriptPath);
                    const righturi = vscode.Uri.file(serverScript.path);
                    vscode.commands.executeCommand('vscode.diff', lefturi, righturi, title).then(() => {
                        resolve();
                    }, (reason) => {
                        vscode.window.showErrorMessage('Compare script failed ' + reason);
                        resolve();
                    });
                } catch (err) {
                    reject(err);
                }

            });
        }).catch((reason) => {
            vscode.window.showErrorMessage('Compare script failed: ' + reason);
            reject();
        });
    });
}

/**
 * Download script names
 */
export function getScriptnames(loginData: nodeDoc.ConnectionInformation, param: any) {
    nodeDoc.serverSession(loginData, [], nodeDoc.getScriptsFromServer).then((_scripts) => {
        helpers.writeScriptNamesToFile(_scripts);
        console.log('Wrote scripts to file and opened the file');
    }).catch((reason) => {
        vscode.window.showErrorMessage('get scriptnames failed: ' + reason);
    });
}



async function getSelectedScriptNames(loginData: nodeDoc.ConnectionInformation): Promise<nodeDoc.scriptT[]> {
    return new Promise<nodeDoc.scriptT[]>((resolve, reject) => {

        const scripts: nodeDoc.scriptT[] = helpers.getDownloadScriptNamesFromList();
        if (0 < scripts.length) {
            return resolve(scripts);
        }

        nodeDoc.serverSession(loginData, [], nodeDoc.getScriptsFromServer).then((serverScripts) => {
            resolve(serverScripts);
        }).catch((reason) => {
            reject(reason);
        });
    });
}

async function getServerScriptNames(loginData: nodeDoc.ConnectionInformation): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {

        nodeDoc.serverSession(loginData, [], nodeDoc.getScriptNamesFromServer).then((serverScripts) => {
            resolve(serverScripts);
        }).catch((reason) => {
            reject(reason);
        });
    });
}


export async function getFileTypesTSD(loginData: nodeDoc.ConnectionInformation): Promise<string> {
    await login.ensureLoginInformation(loginData);

    return new Promise<string>((resolve, reject) => {

        nodeDoc.serverSession(loginData, [], nodeDoc.getFileTypesTSD).then((result) => {
            if (!result || result.length === 0) {
                return reject('TSD file was not created');
            }
            if (result[0].length === 0) {
                return reject('TSD file is empty');
            }
            resolve(result[0]);
        }).catch((reason) => {
            reject(reason);
        });
    });
}

