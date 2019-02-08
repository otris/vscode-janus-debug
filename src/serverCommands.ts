import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
/** ToDo: must be removed to allow tests in mocha */
import * as vscode from 'vscode';
import * as helpers from './helpers';
import { getTime } from './helpers';
import * as interactive from './interactive';
import * as login from './login';
import { getExactVersion } from './serverVersion';
import * as settings from './settings';

// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');






/**
 * Common function for uploading script.
 *
 * @param loginData
 * @param param
 */
async function uploadScriptCommon(loginData: nodeDoc.ConnectionInformation, param: any): Promise<void> {
    const conf = vscode.workspace.getConfiguration('vscode-janus-debug');
    const rootPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    await login.ensureLoginInformation(loginData);

    return new Promise<void>((resolve, reject) => {
        helpers.ensureScript(param).then((_script) => {

            // get information from settings and hash values
            settings.setConflictModes(conf.get('forceUpload', false), [_script]);
            settings.readHashValues(conf.get('forceUpload', false), rootPath, [_script], loginData.server);
            settings.readEncryptionFlag(conf.get('encryptOnUpload', false), conf.get('encryptionOnUpload', "default"), [_script]);
            settings.setScriptInfoJson(conf.get('scriptParameters', false), rootPath, [_script]);
            settings.foldersToCategories(conf.get('categories', false), loginData, [_script]);

            return nodeDoc.serverSession(loginData, [_script], nodeDoc.uploadScript).then((value) => {

                // in case of conflict (server-script changed by someone else)
                // returned script contains local and server code
                // otherwise returned script == input script
                const script: nodeDoc.scriptT = value[0];

                // in case of conflict, ask if script should be force-uploaded
                interactive.ensureForceUpload(conf.get('forceUpload', false), conf.get('categories', false), [script]).then(([noConflict, forceUpload]) => {

                    // if forceUpload is empty, function resolves
                    nodeDoc.serverSession(loginData, forceUpload, nodeDoc.uploadScript).then(() => {
                        settings.updateHashValues(conf.get('forceUpload', false), rootPath, [script], loginData.server);

                        // script not uploaded, if conflict is true
                        if (script.conflict) {
                            return resolve();
                        }

                        vscode.window.setStatusBarMessage(`uploaded ${script.name} at ${getTime()} to ${loginData.server}/${loginData.principal}`);
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
 * Upload all
 */
export function uploadAll(loginData: nodeDoc.ConnectionInformation, paramPath: any): Promise<void> {
    const conf = vscode.workspace.getConfiguration('vscode-janus-debug');
    const rootPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

    return new Promise<void>(async (resolve, reject) => {
        try {
            await login.ensureLoginInformation(loginData);
        } catch (reason) {
            return reject(reason);
        }

        helpers.ensurePath(paramPath).then(async (folder) => {

            // get all script paths in folder and subfolders
            const folderScripts = nodeDoc.getScriptsFromFolderSync(folder);


            settings.setConflictModes(conf.get('forceUpload', false), folderScripts);
            settings.readHashValues(conf.get('forceUpload', false), rootPath, folderScripts, loginData.server);
            settings.readEncryptionFlag(conf.get('encryptOnUpload', false), conf.get('encryptionOnUpload', "default"), folderScripts);
            settings.setScriptInfoJson(conf.get('scriptParameters', false), rootPath, folderScripts);
            settings.foldersToCategories(conf.get('categories', false), loginData, folderScripts);

            return nodeDoc.serverSession(loginData, folderScripts, nodeDoc.uploadAll).then((value1) => {
                const retScripts: nodeDoc.scriptT[] = value1;

                // ask user about how to handle conflict scripts
                interactive.ensureForceUpload(conf.get('forceUpload', false), conf.get('categories', false), retScripts).then(([noConflict, forceUpload]) => {

                    // forceUpload might be empty, function resolves anyway
                    nodeDoc.serverSession(loginData, forceUpload, nodeDoc.uploadAll).then((value2) => {
                        const retScripts2: nodeDoc.scriptT[] = value2;

                        // retscripts2 might be empty
                        const uploaded = noConflict.concat(retScripts2);

                        settings.updateHashValues(conf.get('forceUpload', false), rootPath, uploaded, loginData.server);

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
    const conf = vscode.workspace.getConfiguration('vscode-janus-debug');
    const rootPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

    // openScriptConsoleOnRunScript is deprecated and will be removed
    // default of both is true, if one of them is false, the user doesn't want to see the console
    const keepHidden = !conf.get('scriptConsole.open', true) || !conf.get('openScriptConsoleOnRunScript', true);
    const clear = conf.get('scriptConsole.clear', true);

    return new Promise<string>(async (resolve, reject) => {
        try {
            await login.ensureLoginInformation(loginData);


            let serverScriptNames;
            if (!param || '.js' !== path.extname(param)) {
                serverScriptNames = await getServerScriptNames(loginData);
            }
            const scriptName = await helpers.ensureServerScriptName(param, serverScriptNames);
            const script = new nodeDoc.scriptT(scriptName, '');


            outputChannel.append(`Starting script ${scriptName} at ${getTime()}${os.EOL}`);
            if (!keepHidden) {
                outputChannel.show();
            }
            if (clear) {
                outputChannel.clear();
            }

            await nodeDoc.serverSession(loginData, [script], nodeDoc.runScript);

            const exactVer = getExactVersion(loginData.documentsVersion);
            let ver = '#' + loginData.documentsVersion;
            if (exactVer !== loginData.documentsVersion) {
                ver = `${exactVer} ` + ver;
            }

            outputChannel.append(script.output + os.EOL);
            outputChannel.append(`Script finished at ${getTime()} on ${loginData.server} ${ver}${os.EOL}`);
            if (!keepHidden) {
                outputChannel.show();
            }

            settings.scriptLog(conf.get('scriptLog'), rootPath, script.output);

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
 * Upload and debug script
 */
export async function uploadDebugScript(loginData: nodeDoc.ConnectionInformation, param: any, outputChannel: vscode.OutputChannel): Promise<void> {
    const conf = vscode.workspace.getConfiguration('vscode-janus-debug');
    const rootPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

    try {
        await uploadScriptCommon(loginData, param);
        await login.ensureLoginInformation(loginData);


        let serverScriptNames;
        if (!param || '.js' !== path.extname(param)) {
            serverScriptNames = await getServerScriptNames(loginData);
        }
        const scriptName = await helpers.ensureServerScriptName(param, serverScriptNames);
        const script = new nodeDoc.scriptT(scriptName, '');



        outputChannel.append('Start script at ' + getTime() + os.EOL);
        outputChannel.show();

        await nodeDoc.serverSession(loginData, [script], nodeDoc.debugScript);

        const exactVer = getExactVersion(loginData.documentsVersion);
        let ver = '#' + loginData.documentsVersion;
        if (exactVer !== loginData.documentsVersion) {
            ver += ` (${exactVer})`;
        }
        outputChannel.append(script.output + os.EOL);
        outputChannel.append(`Script finished at ` + getTime() + ` on DOCUMENTS ${ver}` + os.EOL);
        outputChannel.show();

        settings.scriptLog(conf.get('scriptLog'), rootPath, script.output);

        vscode.window.setStatusBarMessage('Script ' + scriptName + ' finished at ' + getTime());
    } catch (e) {
        vscode.window.showErrorMessage(`Upload and Debug failed: ${e}`);
    }
}

/**
 * Upload and run script
 */
export function uploadRunScript(loginData: nodeDoc.ConnectionInformation, param: any, outputChannel: vscode.OutputChannel): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        let scriptName;

        try {
            vscode.window.setStatusBarMessage(`Uploading script at ${getTime()}`);
            await uploadScriptCommon(loginData, param);
        } catch (reason) {
            return reject();
        }

        try {
            vscode.window.setStatusBarMessage(`Starting script at ${getTime()}`);
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
 * contain the corresponding path. Then it is either a folder or a .js file.
 * Otherwise it is undefined.
 */
export async function downloadScript(loginData: nodeDoc.ConnectionInformation, param: string | undefined): Promise<void> {
    const conf = vscode.workspace.getConfiguration('vscode-janus-debug');
    const rootPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

    return new Promise<void>(async (resolve, reject) => {
        const categoriesToFolders = (!param || '.js' !== path.extname(param));
        let scriptDir = "";
        let script: nodeDoc.scriptT;

        try {
            await login.ensureLoginInformation(loginData);
            scriptDir = await helpers.ensurePath(param, true);



            let serverScriptNames;
            if (!param || '.js' !== path.extname(param)) {
                const category = settings.getCategoryFromPath(conf.get('categories', false), scriptDir);
                serverScriptNames = await getServerScriptNames(loginData, category ? [category] : []);
            }
            const scriptName = await helpers.ensureServerScriptName(param, serverScriptNames);
            script = new nodeDoc.scriptT(scriptName);



            script.path = path.join(scriptDir, scriptName + '.js');

        } catch (err) {
            vscode.window.showErrorMessage('download script failed: ' + err);
            return reject();
        }




        settings.getScriptInfoJson(conf.get('scriptParameters', false), [script]);

        return nodeDoc.serverSession(loginData, [script], nodeDoc.downloadScript).then((value) => {
            script = value[0];

            if (categoriesToFolders) {
                // if download is called directly on a script, the path
                // should not be changed
                const invalidNames = settings.categoriesToFolders(conf.get('categories', false), loginData.documentsVersion, [script], scriptDir);
                if (invalidNames.length > 0) {
                    vscode.window.showWarningMessage(`Cannot create folder from category '${invalidNames[0]}' - please remove special characters`);
                }
            }

            return nodeDoc.saveScriptUpdateSyncHash([script]).then(() => {
                settings.updateHashValues(conf.get('forceUpload', false), rootPath, [script], loginData.server);
                settings.writeScriptInfoJson(conf.get('scriptParameters', false), rootPath, [script]);
                vscode.window.setStatusBarMessage('downloaded: ' + script.name);

                if (!script.path) {
                    return resolve();
                }
                const openPath = vscode.Uri.file(script.path);
                vscode.workspace.openTextDocument(openPath).then(doc => {
                    vscode.window.showTextDocument(doc);
                });
                resolve();
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
 * @param reload set to true if called from reload, because reaload should not change any script path
 */
export async function downloadAllCommon(loginData: nodeDoc.ConnectionInformation, inputScripts: nodeDoc.scriptT[], downloadFolder: string, categories = false): Promise<number> {
    const conf = vscode.workspace.getConfiguration('vscode-janus-debug');
    const rootPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

    return new Promise<number>(async (resolve, reject) => {

        // set downloadParameters flag in script structure,
        // if scriptParameters is true in settings.json
        settings.getScriptInfoJson(conf.get('scriptParameters', false), inputScripts);

        // download scripts from server
        return nodeDoc.serverSession(loginData, inputScripts, nodeDoc.downloadAll).then((outputScripts) => {

            if (categories) {
                // the next two functions decide where to save the scripts and save the scripts,
                // the locations where scripts are saved vary depending on downloadFolder
                // downloadFolder could be a ...
                // * category folder
                // * normal folder that does not contain category folders
                // * normal folder that contains category folders

                // change script paths from scripts with categories
                const invalidNames = settings.categoriesToFolders(conf.get('categories', false), loginData.documentsVersion, outputScripts, downloadFolder);
                if (invalidNames.length > 0) {
                    vscode.window.showWarningMessage(`Cannot create folder from category '${invalidNames[0]}' - please remove special characters`);
                }
            }

            // save script to file and update hash value in script structure
            return nodeDoc.saveScriptUpdateSyncHash(outputScripts).then((numSavedScripts) => {

                // write hash values from script structure to file
                settings.updateHashValues(conf.get('forceUpload', false), rootPath, outputScripts, loginData.server);

                // write parameters to file
                if (vscode.workspace.workspaceFolders) {
                    settings.writeScriptInfoJson(conf.get('scriptParameters', false), vscode.workspace.workspaceFolders[0].uri.fsPath, outputScripts);
                }

                // if a script from inputScripts list is not downloaded but the function resolves,
                // the script is encrypted on server
                const encryptedScripts = inputScripts.length - outputScripts.length;
                if (1 <= encryptedScripts) {
                    vscode.window.showWarningMessage(`couldn't download ${encryptedScripts} scripts (scripts probably encrypted)`);
                }

                resolve(numSavedScripts);
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
            const scripts = await getSelectedScriptNames(loginData, []);

            // set download folder to scripts paths
            helpers.setPaths(scripts, downloadFolder);

            vscode.window.setStatusBarMessage(`downloading scripts...`);
            const numDownloaded = await downloadAllCommon(loginData, scripts, downloadFolder, true);
            vscode.window.setStatusBarMessage(`downloaded ${numDownloaded} scripts`);

            return resolve();
        } catch (err) {
            vscode.window.showErrorMessage('Download All failed: ' + err);
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
export async function reloadScripts(loginData: nodeDoc.ConnectionInformation, fileOrfolder: string | undefined): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await login.ensureLoginInformation(loginData);

            // get download folder
            const downloadFolder = await helpers.ensurePath(fileOrfolder, true);

            // get all scripts in that folder and subfolders
            // and set paths to script structures
            const scripts = nodeDoc.getScriptsFromFolderSync(downloadFolder);

            vscode.window.setStatusBarMessage(`reloading scripts...`);
            const numDownloaded = await downloadAllCommon(loginData, scripts, downloadFolder, false);
            vscode.window.setStatusBarMessage(`reloaded ${numDownloaded} scripts`);

            return resolve();
        } catch (err) {
            vscode.window.showErrorMessage('reload all failed: ' + err);
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
                    if (!serverScript.path) {
                        return resolve();
                    }
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


export async function showImports(loginData: nodeDoc.ConnectionInformation, param: string | undefined): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await login.ensureLoginInformation(loginData);

            let serverScriptNames;
            if (!param || '.js' !== path.extname(param)) {
                serverScriptNames = await getServerScriptNames(loginData);
            }
            const scriptName = await helpers.ensureServerScriptName(param, serverScriptNames);
            // const script = new nodeDoc.scriptT(scriptName, '');

            const returnValue = await nodeDoc.serverSession(loginData, [scriptName], nodeDoc.getSourceCodeForEditor);
            const doc = await vscode.workspace.openTextDocument({ content: returnValue[0], language: 'javascript' });
            const editor = await vscode.window.showTextDocument(doc);
            resolve();

        } catch (reason) {
            vscode.window.showErrorMessage('Show Server File failed: ' + reason);
            reject();
        }
    });
}



/**
 * No vscode inside function
 * ==> prepared for mocha test (special tests using Documents server)
 */
export async function exportXML(loginData: nodeDoc.ConnectionInformation, param: nodeDoc.xmlExport, workspaceFolder: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {

        const subFolder = param.className === "DlcFileType" ? "fileTypes" : "portalScripts";
        let baseName;
        if (param.fileName) {
            baseName = param.fileName + ".xml";
        } else if (param.className === "DlcFileType") {
            baseName = "allFileTypes.xml";
        } else {
            baseName = "allPortalScripts.xml";
        }
        const exportDir = path.join(workspaceFolder, subFolder);

        try {
            await login.ensureLoginInformation(loginData);

            const returnValue: string[] = await nodeDoc.serverSession(loginData, [param.className, param.filter], nodeDoc.exportXML);
            const xmlOutput = returnValue[0];
            if (xmlOutput && xmlOutput.length > 0) {
                fs.ensureDirSync(exportDir);
                fs.writeFileSync(path.join(exportDir, baseName), xmlOutput);
            }
            resolve();

        } catch (reason) {
            reject('Export XML failed: ' + reason);
        }
    });
}


/**
 * No vscode inside function
 * ==> prepared for mocha test (special tests using Documents server)
 */
export async function exportXMLSeperateFiles(loginData: nodeDoc.ConnectionInformation, xmlExports: nodeDoc.xmlExport[], workspaceFolder: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        if (xmlExports.length === 0) {
            return reject('Export XML failed: incorrect input');
        }

        const subFolder = xmlExports[0].className === "DlcFileType" ? "fileTypes" : "portalScripts";
        const exportDir = path.join(workspaceFolder, subFolder);

        try {
            await login.ensureLoginInformation(loginData);

            await nodeDoc.serverSession(loginData, xmlExports, nodeDoc.exportXMLSeperateFiles);
            fs.ensureDirSync(exportDir);
            xmlExports.forEach((item) => {
                const baseName = item.fileName + ".xml";
                const xmlOutput = item.content;
                if (xmlOutput) {
                    fs.writeFileSync(path.join(exportDir, baseName), item.content);
                }
            });
            resolve();

        } catch (reason) {
            reject('Export XML (seperate files) failed: ' + reason);
        }
    });
}


/**
 * Download script names
 */
export function maintananceOperation(loginData: nodeDoc.ConnectionInformation, param: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        nodeDoc.serverSession(loginData, [param], nodeDoc.doMaintenance).then((returnValue) => {
            resolve(returnValue[0]);
        }).catch((reason) => {
            vscode.window.showErrorMessage('maintenance operation failed: ' + reason);
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



async function getSelectedScriptNames(loginData: nodeDoc.ConnectionInformation, params: string[] = []): Promise<nodeDoc.scriptT[]> {
    return new Promise<nodeDoc.scriptT[]>((resolve, reject) => {

        const scripts: nodeDoc.scriptT[] = helpers.getDownloadScriptNamesFromList();
        if (0 < scripts.length) {
            return resolve(scripts);
        }

        nodeDoc.serverSession(loginData, params, nodeDoc.getScriptsFromServer).then((serverScripts) => {
            resolve(serverScripts);
        }).catch((reason) => {
            reject(reason);
        });
    });
}

/**
 * @param params not used for now
 */
export async function getServerScriptNames(loginData: nodeDoc.ConnectionInformation, params: string[] = []): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {

        nodeDoc.serverSession(loginData, params, nodeDoc.getScriptNamesFromServer).then((names) => {
            resolve(names);
        }).catch((reason) => {
            reject(reason);
        });
    });
}

/**
 * @param params not used for now
 */
export async function getServerFileTypeNames(loginData: nodeDoc.ConnectionInformation, params: string[] = []): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {

        nodeDoc.serverSession(loginData, params, nodeDoc.getFileTypeNames).then((names) => {
            resolve(names);
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
