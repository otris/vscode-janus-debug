'use strict';

import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as helpers from './helpers';
import * as login from './login';

// tslint:disable-next-line:no-var-requires
const urlExists = require('url-exists');
// tslint:disable-next-line:no-var-requires
const open = require('open');
// tslint:disable-next-line:no-var-requires
const stripJsonComments = require('strip-json-comments');

const VERSION_SCRIPT_PARAMS = '8035';

/**
 * Save login data
 */
export function saveLoginData(loginData: nodeDoc.LoginData, param: any) {
    if (loginData) {
        login.createLoginData(loginData).then(() => {
            vscode.window.setStatusBarMessage('Saved login data');
        }).catch((reason) => {
            vscode.window.showWarningMessage(reason);
        });
    } else {
        vscode.window.showErrorMessage('unexpected error: login data object missing');
    }
}

/**
 * Common function for uploading script.
 *
 * @param loginData
 * @param param
 */
async function _uploadScript(loginData: nodeDoc.LoginData, param: any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        helpers.ensureScript(param).then((_script) => {

            helpers.readHashValues([_script]);
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
export function uploadScript(loginData: nodeDoc.LoginData, param: any) {
    _uploadScript(loginData, param).then((scriptname) => {
        vscode.window.setStatusBarMessage('uploaded: ' + scriptname);
    }).catch((reason) => {
        vscode.window.showErrorMessage(reason);
    });
}

/**
 * Upload script on save
 */
export function uploadScriptOnSave(loginData: nodeDoc.LoginData, fileName: string) {
    helpers.ensureUploadOnSave(fileName).then((value) => {
        if (value) {

            _uploadScript(loginData, fileName).then((scriptname) => {
                vscode.window.setStatusBarMessage('uploaded: ' + scriptname);
            }).catch((reason) => {
                vscode.window.showErrorMessage(reason);
            });

        }
    }).catch((reason) => {
        vscode.window.showErrorMessage('upload script failed: ' + reason);
    });
}

/**
 * Upload and run script
 */
export function uploadRunScript(loginData: nodeDoc.LoginData, param: any, myOutputChannel: vscode.OutputChannel) {
    _uploadScript(loginData, param).then((scriptname) => {

        let script: nodeDoc.scriptT = { name: scriptname };
        return nodeDoc.sdsSession(loginData, [script], nodeDoc.runScript).then((value) => {
            script = value[0];
            myOutputChannel.append(script.output + os.EOL);
            myOutputChannel.show();
        });

    }).catch((reason) => {
        vscode.window.showErrorMessage(reason);
    });
}

/**
 * Upload all
 */
export function uploadAll(loginData: nodeDoc.LoginData, _param: any) {
    helpers.ensurePath(_param).then((folder) => {
        return nodeDoc.getScriptsFromFolder(folder[0]).then((folderscripts) => {

            helpers.readHashValues(folderscripts);
            return nodeDoc.sdsSession(loginData, folderscripts, nodeDoc.uploadAll).then((value1) => {
                const retscripts: nodeDoc.scriptT[] = value1;

                // ask user about how to handle conflict scripts
                helpers.ensureForceUpload(retscripts).then(([noConflict, forceUpload]) => {

                    // forceUpload might be empty, function resolves anyway
                    nodeDoc.sdsSession(loginData, forceUpload, nodeDoc.uploadAll).then((value2) => {
                        const retscripts2: nodeDoc.scriptT[] = value2;

                        // retscripts2 might be empty
                        const uploaded = noConflict.concat(retscripts2);

                        helpers.updateHashValues(uploaded);

                        vscode.window.setStatusBarMessage('uploaded ' + uploaded.length + ' scripts from ' + folder[0]);
                    }).catch((reason) => {
                        vscode.window.showErrorMessage('force upload of conflict scripts failed: ' + reason);
                    });
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
    helpers.ensureScriptName(param).then((scriptname) => {
        return helpers.ensurePath(param, true).then((_path) => {
            let script: nodeDoc.scriptT = { name: scriptname, path: _path[0] };

            helpers.readConflictModes([script]);
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
    helpers.ensurePath(_param, true).then((_path) => {

        // get names of scripts that should be downloaded
        return helpers.getDownloadScriptNames(loginData).then((_scripts) => {

            // set download path to scripts
            _scripts.forEach(function(script) {
                script.path = _path[0];
            });

            helpers.readConflictModes(_scripts);

            // download scripts
            return nodeDoc.sdsSession(loginData, _scripts, nodeDoc.dwonloadAll).then((scripts) => {
                const numscripts = scripts.length;
                helpers.updateHashValues(scripts);
                vscode.window.setStatusBarMessage('downloaded ' + numscripts + ' scripts');
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
        let script: nodeDoc.scriptT = { name: scriptname };
        return nodeDoc.sdsSession(loginData, [script], nodeDoc.runScript).then((value) => {
            script = value[0];
            myOutputChannel.append(script.output + os.EOL);
            myOutputChannel.show();
        });
    }).catch((reason) => {
        vscode.window.showErrorMessage('run script failed: ' + reason);
    });
}

/**
 * Compare script
 */
export function compareScript(loginData: nodeDoc.LoginData, _param: any) {
    helpers.ensurePath(_param, false, true).then((_path) => {
        const scriptfolder = _path[0];
        const _scriptname = _path[1];
        return helpers.ensureScriptName(_scriptname).then((scriptname) => {
            let comparepath: string;
            if (vscode.workspace) {
                comparepath = path.join(vscode.workspace.rootPath, helpers.COMPARE_FOLDER);
            } else {
                comparepath = path.join(scriptfolder, helpers.COMPARE_FOLDER);
            }
            return helpers.createFolder(comparepath, true).then(() => {
                let script: nodeDoc.scriptT = { name: scriptname, path: comparepath, rename: helpers.COMPARE_FILE_PREFIX + scriptname };
                return nodeDoc.sdsSession(loginData, [script], nodeDoc.downloadScript).then((value) => {
                    script = value[0];
                    helpers.compareScript(scriptfolder, scriptname);
                });
            });
        });
    }).catch((reason) => {
        vscode.window.showErrorMessage('compare script failed: ' + reason);
    });
}

/**
 * Download scriptnames
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
            const errmsg = `Get Script Parameters: requiered DOCUMENTS version is ${VERSION_SCRIPT_PARAMS}, you are using ${doc.version}`;
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
                        const jsonOtuput = JSON.stringify(scriptsObject, null, '\t').split('\n').map(line => '\t' + line).join('\n').trim();
                        // save json to workspace or write it to console
                        if (vscode.workspace) {
                            const jsonfilename = 'jscript.specs.json';
                            const jsonfilepath = path.join(vscode.workspace.rootPath, jsonfilename);
                            return nodeDoc.writeFile(jsonOtuput, jsonfilepath).then(() => {
                                vscode.window.setStatusBarMessage('wrote script parameters to ' + jsonfilename);
                            });
                        } else {
                            console.log(jsonOtuput);
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
    const portalscriptdocu = 'http://doku.otris.de/api/portalscript/';
    urlExists(portalscriptdocu, function(err: any, exists: any) {
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
            let currline: string = editor.document.lineAt(cnt).text;
            while (currline.startsWith('import')) {
                cnt++;
                currline = editor.document.lineAt(cnt).text;
            }

            // first line after import should look like "export class Context {"
            const _words = currline.split(' ');
            if (_words.length !== 4 || _words[0] !== 'export' || _words[1] !== 'class' || _words[3] !== '{') {
                return;
            }


            const classname = _words[2];

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

            const jsFileName = 'class' + classname + '.js';
            const htmlFileName = 'class' + classname + '.html';
            const jsFilePath = path.join(vscode.workspace.rootPath, 'mapping', jsFileName);

            fs.readFile(jsFilePath, (error, data) => {

                const browser = 'firefox';
                if (err || !data) {
                    const page = portalscriptdocu + htmlFileName;
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
                            const page = portalscriptdocu + link;
                            open(page, browser);
                            break;
                        }
                    }
                    if (i === lines.length - 1) {
                        const page = portalscriptdocu + htmlFileName;
                        open(page, browser);
                    }
                }
            });
        }
    });
}

// rename to getJSFromTS
// export async function uploadJSFromTS(sdsConnection: SDSConnection, textDocument: vscode.TextDocument): Promise<void> {
//     return new Promise<void>((resolve, reject) => {

//         if(!textDocument || '.ts' !== path.extname(textDocument.fileName)) {
//             reject('No active ts script');

//         } else {
//             let shortName = '';
//             let scriptSource = '';

//             shortName = path.basename(textDocument.fileName, '.ts');
//             let tsname:string = textDocument.fileName;
//             let jsname:string = tsname.substr(0, tsname.length - 3) + ".js";
//             //let tscargs = ['--module', 'commonjs', '-t', 'ES6'];
//             let tscargs = ['-t', 'ES5', '--out', jsname];
//             let retval = tsc.compile([textDocument.fileName], tscargs, null, function(e) { console.log(e); });
//             scriptSource = retval.sources[jsname];
//             console.log("scriptSource: " + scriptSource);

//             sdsAccess.uploadScript(sdsConnection, shortName, scriptSource).then((value) => {
//                 vscode.window.setStatusBarMessage('uploaded: ' + shortName);
//                 resolve();
//             }).catch((reason) => {
//                 reject(reason);
//             });
//         }
//     });
// }
