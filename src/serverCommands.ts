'use strict';

import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as helpers from './helpers';
import { getErrorMsg, getTime } from './helpers';
import * as login from './login';
import { mapVersion } from './serverVersion';
import stripJsonComments = require('strip-json-comments');
import { scriptT } from 'node-documents-scripting';

// tslint:disable-next-line:no-var-requires
const tsc = require('typescript-compiler');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

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
                vscode.window.showErrorMessage(getErrorMsg(reason));
                reject();
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
async function uploadScriptCommon(loginData: nodeDoc.ConnectionInformation, param: any): Promise<void> {
    await login.ensureLoginInformation(loginData);

    return new Promise<void>((resolve, reject) => {
        helpers.ensureScript(param).then((_script) => {

            // get information from settings and hash values
            helpers.setConflictModes([_script]);
            helpers.readHashValues([_script], loginData.server);
            helpers.readEncryptionFlag([_script]);
            helpers.setScriptInfoJson([_script]);

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
            let serverScriptNames;
            if (!param || '.js' !== path.extname(param)) {
                serverScriptNames = await getServerScriptNames(loginData);
            }
            const scriptName = await helpers.ensureScriptName(param, serverScriptNames);
            const script = new nodeDoc.scriptT(scriptName, '');

            outputChannel.append('Start script at ' + getTime() + os.EOL);
            outputChannel.show();

            await nodeDoc.serverSession(loginData, [script], nodeDoc.runScript);

            const ver = mapVersion(loginData.documentsVersion) + ' (' + loginData.documentsVersion + ')';
            outputChannel.append(script.output + os.EOL);
            outputChannel.append(`Script finished at ` + getTime() + ` on DOCUMENTS ${ver}` + os.EOL);
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
        vscode.window.setStatusBarMessage('Start script at ' + getTime());

        try {
            scriptName = await runScriptCommon(loginData, param, outputChannel);
        } catch (reason) {
            vscode.window.showErrorMessage('run script failed: ' + reason);
            return reject();
        }

        vscode.window.setStatusBarMessage('Script ' + scriptName + ' finished at ' + getTime());
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
            vscode.window.setStatusBarMessage('Upload ' + scriptName + ' at ' + getTime());
            scriptName = await uploadScriptCommon(loginData, param);
            vscode.window.setStatusBarMessage('Uploaded ' + scriptName + ' at ' + getTime());
        } catch (reason) {
            return reject();
        }

        try {
            vscode.window.setStatusBarMessage('Start script ' + scriptName + ' at ' + getTime());
            scriptName = await runScriptCommon(loginData, param, outputChannel);
            vscode.window.setStatusBarMessage('Script ' + scriptName + ' finished at ' + getTime());
        } catch (reason) {
            vscode.window.showErrorMessage('run script failed: ' + reason);
            return reject();
        }

        resolve();
    });
}


/**
 * Download script
 *
 * @param contextMenuPath: If command is called from context menu, this variable should
 * contain the corresponding path. Otherwise it should be undefined.
 */
export async function downloadScript(loginData: nodeDoc.ConnectionInformation, contextMenuPath: string | undefined): Promise<void>  {
    return new Promise<void>(async (resolve, reject) => {
        let serverScriptNames;

        try {
            await login.ensureLoginInformation(loginData);

            if (!contextMenuPath || '.js' !== path.extname(contextMenuPath)) {
                serverScriptNames = await getServerScriptNames(loginData);
            }
        } catch (err) {
            return reject();
        }


        helpers.ensureScriptName(contextMenuPath, serverScriptNames).then((scriptName) => {
            return helpers.ensurePath(contextMenuPath, true).then((scriptDir) => {
                const scriptPath = path.join(scriptDir, scriptName + '.js');
                let script: nodeDoc.scriptT = new nodeDoc.scriptT(scriptName, scriptPath);

                helpers.getScriptInfoJson([script]);

                return nodeDoc.serverSession(loginData, [script], nodeDoc.downloadScript).then((value) => {
                    script = value[0];

                    return nodeDoc.saveScriptUpdateSyncHash([script]).then(() => {
                        helpers.updateHashValues([script], loginData.server);
                        helpers.writeScriptInfoJson([script]);
                        vscode.window.setStatusBarMessage('downloaded: ' + script.name);
                        resolve();
                    });
                });
            });
        }).catch((reason) => {
            vscode.window.showErrorMessage('download script failed: ' + reason);
            reject();
        });
    });
}


/**
 * Downloads all scripts from list inputScripts to folder in downloadFolder
 * @param loginData Information to connect to the server
 * @param inputScripts the list of scripts that should be downloaded
 * @param downloadFolder the folder where the scripts should be downloaded
 */
export async function downloadAllCommon(loginData: nodeDoc.ConnectionInformation, inputScripts: scriptT[], downloadFolder: string): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {

        // set downloadParameters flag in script structure,
        // if scriptParameters is true in settings.json
        helpers.getScriptInfoJson(inputScripts);

        // download scripts from server
        return nodeDoc.serverSession(loginData, inputScripts, nodeDoc.downloadAll).then((outputScripts) => {

            // save script to file and update hash value in script structure
            return nodeDoc.saveScriptUpdateSyncHash(outputScripts).then(() => {

                // write hash values to file
                helpers.updateHashValues(outputScripts, loginData.server);

                // write parameters to file
                helpers.writeScriptInfoJson(outputScripts);

                // if a script from inputScripts list is not downloaded but the function resolves,
                // the script is encrypted on server
                const encryptedScripts = inputScripts.length - outputScripts.length;
                if (1 <= encryptedScripts) {
                    vscode.window.showWarningMessage(`couldn't download ${encryptedScripts} scripts (scripts encrypted or not found)`);
                }

                resolve(outputScripts.length);
            });
        }).catch((reason) => {
            reject(reason);
        });
    });
}




/**
 * Download all (selected) scripts.
 * For now it's not possible to select scripts in the selection list.
 * So for normal users, this function will download all scripts on server.
 *
 * If SCRIPT_NAMES_FILE exists: download selected scripts in that file.
 * If the file SCRIPT_NAMES_FILE exists, any line of this file will be
 * interpreted as a script name. Then only scripts from this list
 * that can be found on server will be downloaded.
 */
export async function downloadAllSelected(loginData: nodeDoc.ConnectionInformation, fileOrfolder: string | undefined): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await login.ensureLoginInformation(loginData);

            // get download folder
            const downloadFolder = await helpers.ensurePath(fileOrfolder, true);

            // get all scripts on server
            // or if SCRIPT_NAMES_FILE exists: all scripts in that file
            const scripts = await getSelectedScriptNames(loginData);

            // set download path to scripts
            scripts.forEach(function(script: any) {
                script.path = path.join(downloadFolder, script.name + '.js');
            });

            const numDownloaded = await downloadAllCommon(loginData, scripts, downloadFolder);
            vscode.window.setStatusBarMessage(`downloaded ${numDownloaded} scripts`);

            return resolve();
        } catch (err) {
            vscode.window.showErrorMessage('download all failed: ' + err);
            return reject();
        }
    });
}


/**
 * Download scripts that are found in the folder or subfolder and on the server.
 * Scripts will be downloaded to the path where they are (so the folder or a subfolder).
 * If fileOrFolder is a file path, the function will get the folder of this file
 * and use this folder.
 *
 * @param loginData Connection information
 * @param fileOrfolder a path to a file or folder
 */
export async function downloadScriptsInsideFolder(loginData: nodeDoc.ConnectionInformation, fileOrfolder: string | undefined): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await login.ensureLoginInformation(loginData);

            // get download folder
            const downloadFolder = await helpers.ensurePath(fileOrfolder, true);

            // get all scripts in that folder and subfolders
            // and set paths to script structures
            const scripts = nodeDoc.getScriptsFromFolderSync(downloadFolder);

            const numDownloaded = await downloadAllCommon(loginData, scripts, downloadFolder);
            vscode.window.setStatusBarMessage(`downloaded ${numDownloaded} scripts`);

            return resolve();
        } catch (err) {
            vscode.window.showErrorMessage('download all failed: ' + err);
            return reject();
        }
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


export async function showImports(loginData: nodeDoc.ConnectionInformation, contextMenuPath: string | undefined, outputChannel: vscode.OutputChannel): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        await login.ensureLoginInformation(loginData);

        helpers.ensureScriptName(contextMenuPath, []).then((scriptName) => {
            return nodeDoc.serverSession(loginData, [scriptName], nodeDoc.getSourceCodeForEditor).then((value) => {
                outputChannel.append(scriptName + ':' + os.EOL);
                outputChannel.append(value + os.EOL);
                outputChannel.show();

                resolve();
            });
        }).catch((reason) => {
            reject(reason);
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


export function getFileTypesTSD(loginData: nodeDoc.ConnectionInformation): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        await login.ensureLoginInformation(loginData);

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

export function getServerVersion(loginData: nodeDoc.ConnectionInformation): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        await login.ensureLoginInformation(loginData);

        nodeDoc.serverSession(loginData, [], nodeDoc.getDocumentsVersion).then(() => {
            if (!loginData.documentsVersion || loginData.documentsVersion.length === 0) {
                return reject('Get Version failed');
            }
            resolve();
        });
    });
}
