'use strict';

import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as helpers from './helpers';
import * as login from './login';
import stripJsonComments = require('strip-json-comments');

// tslint:disable-next-line:no-var-requires
const urlExists = require('url-exists');
// tslint:disable-next-line:no-var-requires
const open = require('open');
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
export async function checkDecryptionVersion(loginData: nodeDoc.LoginData): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (!decrptionVersionChecked) {
            nodeDoc.sdsSession(loginData, [], nodeDoc.checkDecryptionPermission).then((retval1) => {
                const perm: nodeDoc.documentsT = retval1[0];
                decrptionVersionChecked = true;
                if (perm && Number(loginData.DocumentsVersion) < Number(VERSION_DECRYPT_PERM)) {
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
function _uploadScript(loginData: nodeDoc.LoginData, param: any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        helpers.ensureScript(param).then((_script) => {

            // get information from settings and hash values
            helpers.readHashValues([_script]);
            helpers.readEncryptionFlag([_script]);
            helpers.setCategories([_script]);

            return nodeDoc.sdsSession(loginData, [_script], nodeDoc.uploadScript).then((value) => {

                // in case of conflict (server-script changed by someone else)
                // returned script contains local and server code
                // otherwise returned script == input script
                const script: nodeDoc.scriptT = value[0];

                // in case of conflict, ask if script should be force-uploaded
                helpers.ensureForceUpload([script]).then(([noConflict, forceUpload]) => {

                    // if forceUpload is empty function resolves anyway
                    nodeDoc.sdsSession(loginData, forceUpload, nodeDoc.uploadScript).then(() => {

                        // if script had conflict and was not force-uploaded
                        // conflict is true in this script
                        if (true !== script.conflict) {
                            helpers.updateHashValues([script]);
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
export function uploadScript(loginData: nodeDoc.LoginData, param: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        _uploadScript(loginData, param).then((scriptName) => {
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
export function uploadScriptOnSave(loginData: nodeDoc.LoginData, fileName: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        helpers.ensureUploadOnSave(fileName).then((value) => {
            if (helpers.autoUploadAnswer.yes === value) {

                _uploadScript(loginData, fileName).then((scriptName) => {
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

/**
 * Upload and run script
 */
export function uploadRunScript(loginData: nodeDoc.LoginData, param: any, myOutputChannel: vscode.OutputChannel) {
    _uploadScript(loginData, param).then((scriptName) => {

        let script: nodeDoc.scriptT = new nodeDoc.scriptT(scriptName);
        return nodeDoc.sdsSession(loginData, [script], nodeDoc.runScript).then((value) => {
            script = value[0];
            myOutputChannel.append(script.output + os.EOL);
        });

    }).catch((reason) => {
        vscode.window.showErrorMessage(reason);
    });
}

/**
 * Upload all
 */
export function uploadAll(loginData: nodeDoc.LoginData, _param: any) {
    helpers.ensurePathInput(_param).then((folder) => {

        // get all scripts from folder and subfolders and read information
        // from .vscode\settings.json
        const folderScripts = nodeDoc.getScriptsFromFolderSync(folder[0]);
        helpers.readHashValues(folderScripts);
        helpers.readEncryptionFlag(folderScripts);
        helpers.setCategories(folderScripts);

        return nodeDoc.sdsSession(loginData, folderScripts, nodeDoc.uploadAll).then((value1) => {
            const retScripts: nodeDoc.scriptT[] = value1;

            // ask user about how to handle conflict scripts
            helpers.ensureForceUpload(retScripts).then(([noConflict, forceUpload]) => {

                // forceUpload might be empty, function resolves anyway
                nodeDoc.sdsSession(loginData, forceUpload, nodeDoc.uploadAll).then((value2) => {
                    const retScripts2: nodeDoc.scriptT[] = value2;

                    // retscripts2 might be empty
                    const uploaded = noConflict.concat(retScripts2);

                    helpers.updateHashValues(uploaded);

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
 */
export function downloadScript(loginData: nodeDoc.LoginData, param: any) {
    helpers.ensureScriptName(param).then((scriptName) => {
        return helpers.ensurePathInput(param, true).then((_path) => {
            let script: nodeDoc.scriptT = new nodeDoc.scriptT(scriptName, _path[0]);

            helpers.readConflictModes([script]);
            helpers.setCategoryRoots([script]);

            return nodeDoc.sdsSession(loginData, [script], nodeDoc.downloadScript).then((value) => {
                script = value[0];
                helpers.updateHashValues([script]);
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
export function downloadAll(loginData: nodeDoc.LoginData, _param: any) {
    helpers.ensurePathInput(_param, true).then((_path) => {

        // get names of scripts that should be downloaded
        return helpers.getDownloadScriptNames(loginData).then((_scripts) => {

            // set download path to scripts
            _scripts.forEach(function(script) {
                script.path = _path[0];
            });

            helpers.readConflictModes(_scripts);
            helpers.setCategoryRoots(_scripts);

            // download scripts
            return nodeDoc.sdsSession(loginData, _scripts, nodeDoc.downloadAll).then((scripts) => {
                helpers.updateHashValues(scripts);
                // if a script from input list has not been downloaded but the function was resolved
                // then the script is encrypted on server
                const encryptedScripts = _scripts.length - scripts.length;
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
export function runScript(loginData: nodeDoc.LoginData, param: any, myOutputChannel: vscode.OutputChannel) {
    helpers.ensureScriptName(param).then((scriptname) => {
        let script: nodeDoc.scriptT = new nodeDoc.scriptT(scriptname);
        return nodeDoc.sdsSession(loginData, [script], nodeDoc.runScript).then((value) => {
            script = value[0];
            myOutputChannel.append(script.output + os.EOL);
        });
    }).catch((reason) => {
        vscode.window.showErrorMessage('run script failed: ' + reason);
    });
}

/**
 * Compare script
 */
export function compareScript(loginData: nodeDoc.LoginData, _param: any) {
    helpers.ensurePathInput(_param, false, true).then((_path) => {
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
                return nodeDoc.sdsSession(loginData, [script], nodeDoc.downloadScript).then((value) => {
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
export function getScriptnames(loginData: nodeDoc.LoginData, param: any) {
    nodeDoc.sdsSession(loginData, [], nodeDoc.getScriptNamesFromServer).then((_scripts) => {
        helpers.writeScriptNamesToFile(_scripts);
        console.log('Wrote scripts to file and opened the file');
    }).catch((reason) => {
        vscode.window.showErrorMessage('get scriptnames failed: ' + reason);
    });
}

/**
 * Download script parameters
 */
export function getScriptParameters(loginData: nodeDoc.LoginData, param: any) {
    console.log('getScriptParameters');

    // Check documents version
    nodeDoc.sdsSession(loginData, [], nodeDoc.getDocumentsVersion).then((value) => {
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
            return helpers.getDownloadScriptNames(loginData).then((_scripts) => {

                // get parameters
                return nodeDoc.sdsSession(loginData, _scripts, nodeDoc.getAllParameters).then((values) => {
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

/* --------------------------------------------------
 *       todo...
 * -------------------------------------------------- */

export function viewDocumentation() {
    const portalScriptDocs = 'http://doku.otris.de/api/portalscript/';
    urlExists(portalScriptDocs, function(err: any, exists: any) {
        if (!exists) {
            vscode.window.showInformationMessage('Documentation is not available!');
        } else {

            // current editor
            const editor = vscode.window.activeTextEditor;
            if (!editor || !vscode.workspace.rootPath) {
                return;
            }

            // skip import lines
            let cnt = 0;
            let currLine: string = editor.document.lineAt(cnt).text;
            while (currLine.startsWith('import')) {
                cnt++;
                currLine = editor.document.lineAt(cnt).text;
            }

            // first line after import should look like "export class Context {"
            const _words = currLine.split(' ');
            if (_words.length !== 4 || _words[0] !== 'export' || _words[1] !== 'class' || _words[3] !== '{') {
                return;
            }


            const className = _words[2];

            // the Position object gives you the line and character where the cursor is
            const pos = editor.selection.active;
            if (!pos) {
                return;
            }
            const line = editor.document.lineAt(pos.line).text;
            const words = line.split(' ');
            let member = '';

            if (words[0].trim() === 'public') {
                member = words[1].trim();
                const brace = member.indexOf('(');
                if (brace >= 0) {
                    member = member.substr(0, brace);
                }
            }

            const jsFileName = 'class' + className + '.js';
            const htmlFileName = 'class' + className + '.html';
            const jsFilePath = path.join(vscode.workspace.rootPath, 'mapping', jsFileName);

            fs.readFile(jsFilePath, (error: any, data: any) => {

                const browser = 'firefox';
                if (err || !data) {
                    const page = portalScriptDocs + htmlFileName;
                    open(page, browser);

                } else {
                    // \r was missing in the generated files
                    const lines = data.toString().split("\n");

                    let i;
                    for (i = 2; i < lines.length - 1; i++) {
                        const entries = lines[i].split(',');
                        if (entries.length < 2) {
                            continue;
                        }
                        // entries[0] looks like: "     [ "clientId""
                        const entry = entries[0].replace('[', '').replace(/"/g, '').trim();

                        if (entry === member) {
                            // entries[1] looks like: "  "classContext.html#a6d644a063ace489a2893165bb3856579""
                            const link = entries[1].replace(/"/g, '').trim();
                            const page = portalScriptDocs + link;
                            open(page, browser);
                            break;
                        }
                    }
                    if (i === lines.length - 1) {
                        const page = portalScriptDocs + htmlFileName;
                        open(page, browser);
                    }
                }
            });
        }
    });
}





export function uploadJSFromTS(loginData: nodeDoc.LoginData, textDocument: vscode.TextDocument): Promise<void> {
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

            _uploadScript(loginData, jsname).then((scriptname) => {
                vscode.window.setStatusBarMessage('uploaded: ' + scriptname);
                resolve();
            }).catch((reason) => {
                vscode.window.showErrorMessage(reason);
                resolve();
            });
        }
    });
}


export function installIntellisenseFiles() {
    const extension = vscode.extensions.getExtension('otris-software.vscode-janus-debug');
    if (extension && vscode.workspace && vscode.workspace.rootPath) {
        const dtsfile = path.join(extension.extensionPath, 'portalscript', 'typings', 'portalScripting.d.ts');
        const projecttypings = path.join(vscode.workspace.rootPath, 'typings');

        // check typings folder
        try {
            fs.readdirSync(projecttypings);
        } catch (err) {
            if (err.code === 'ENOENT') {
                fs.mkdir(projecttypings);
            }
        }

        // check and copy dts file
        try {
            fs.readFileSync(dtsfile);
            const dstfile = path.join(projecttypings, 'portalScripting.d.ts');
            // overwrites existing on default
            fs.copySync(dtsfile, dstfile);
        } catch (err) {
            vscode.window.showErrorMessage(err);
        }

        // create empty jsconfig.json
        const jsconfig = path.join(vscode.workspace.rootPath, 'jsconfig.json');
        try {
            fs.readFileSync(jsconfig);
        } catch (err) {
            if (err.code === 'ENOENT') {
                fs.writeFileSync(jsconfig, '');
            }
        }
    }
}
