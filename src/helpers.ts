'use strict';

import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import * as path from 'path';
import * as vscode from 'vscode';

// tslint:disable-next-line:no-var-requires
const reduce = require('reduce-for-promises');
// tslint:disable-next-line:no-var-requires
const winattr = require('winattr');

// like eclipse plugin
export const COMPARE_FOLDER = '.compare';
export const COMPARE_FILE_PREFIX = 'compare_';

const FORCE_UPLOAD_YES = 'Yes';
const FORCE_UPLOAD_NO = 'No';
const FORCE_UPLOAD_ALL = 'Yes (remember my answer for this operation)';
const FORCE_UPLOAD_NONE = 'No (remeber my answer for this operation)';
const NO_CONFLICT = 'No conflict';

const CACHE_FILE = '.documents-scripting-cache';

/**
 * Subfunction of ensureUploadScripts.
 *
 * @param script
 * @param all
 * @param none
 */
export async function askForUpload(script: nodeDoc.scriptT, all: boolean, none: boolean, singlescript?: boolean): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (script.conflict) {
            if (all) {
                resolve(FORCE_UPLOAD_ALL);
            } else if (none) {
                resolve(FORCE_UPLOAD_NONE);
            } else {
                const question = script.name + ' has been changed on server, force upload?';
                let answers = [FORCE_UPLOAD_YES, FORCE_UPLOAD_NO];
                if (!singlescript) {
                    answers = [FORCE_UPLOAD_YES, FORCE_UPLOAD_NO, FORCE_UPLOAD_ALL, FORCE_UPLOAD_NONE];
                }
                return vscode.window.showQuickPick(answers, { placeHolder: question }).then((value) => {
                    resolve(value);
                });
            }
        } else {
            resolve(NO_CONFLICT);
        }
    });
}

/**
 * Ask user for all conflicted scripts if they should be force uploaded or if upload should
 * be cancelled
 *
 * @param param List of potentially conflicted scripts.
 *
 * @return Two arrays containing scripts of input array.
 * 1. arrray: scripts that are already uploaded 2. array: scripts that user marked to force upload.
 */
export async function ensureForceUpload(scripts: nodeDoc.scriptT[]): Promise<[nodeDoc.scriptT[], nodeDoc.scriptT[]]> {
    return new Promise<[nodeDoc.scriptT[], nodeDoc.scriptT[]]>((resolve, reject) => {
        const forceUpload: nodeDoc.scriptT[] = [];
        const noConflict: nodeDoc.scriptT[] = [];
        let all = false;
        let none = false;
        const singlescript = (1 === scripts.length);

        return reduce(scripts, (numScripts: number, script: any): Promise<number> => {
            return askForUpload(script, all, none, singlescript).then((value) => {
                if (NO_CONFLICT === value) {
                    noConflict.push(script);
                } else if (FORCE_UPLOAD_ALL === value) {
                    script.forceUpload = true;
                    script.conflict = false;
                    forceUpload.push(script);
                    all = true;
                } else if (FORCE_UPLOAD_YES === value) {
                    script.forceUpload = true;
                    script.conflict = false;
                    forceUpload.push(script);
                } else if (FORCE_UPLOAD_NO === value) {
                    // do nothing ...
                } else {
                    // escape or anything should behave like 'None'
                    none = true;
                }
                return numScripts + 1;
            });
        }, 0).then(() => {
            resolve([noConflict, forceUpload]);
        });
    });
}

/**
 * Read from settings.json if the script must be uploaded.
 * If it's not set, ask user, if the script should be uploaded and if
 * the answer should be saved. If so, save it to settings.json.
 *
 * @param param script-name or -path
 */
export async function ensureUploadOnSave(param: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        let always: string[] = [];
        let never: string[] = [];

        if (!vscode.workspace || !param || 0 === param.length) {
            return;
        }

        const scriptname = path.basename(param, '.js');

        // get extension-part of settings.json
        const conf = vscode.workspace.getConfiguration('vscode-documents-scripting');

        // get the encrypted/decrypted lists
        const _always = conf.get('uploadOnSave');
        const _never = conf.get('uploadManually');
        if (_always instanceof Array && _never instanceof Array) {
            always = _always;
            never = _never;
        } else {
            vscode.window.showWarningMessage('Cannot read encrypted states from settings.json');
            reject();
        }
        if (0 <= never.indexOf(scriptname)) {
            resolve(false);
        } else if (0 <= always.indexOf(scriptname)) {
            resolve(true);
        } else {
            const QUESTION: string = `Upload script ${scriptname}?`;
            const YES: string = 'Yes';
            const NO: string = 'No';
            const ALWAYS: string = 'Yes always (save to settings.json)';
            const NEVER: string = 'No never (save to settings.json)';
            vscode.window.showQuickPick([YES, NO, ALWAYS, NEVER], { placeHolder: QUESTION }).then((answer) => {
                if (YES === answer) {
                    resolve(true);
                } else if (NO === answer) {
                    resolve(false);
                } else if (ALWAYS === answer) {
                    always.push(scriptname);
                    conf.update('uploadOnSave', always);
                    resolve(true);
                } else if (NEVER === answer) {
                    never.push(scriptname);
                    conf.update('uploadManually', never);
                    resolve(false);
                }
            });
        }
    });
}

/**
 * Read downloadScripts-list from settings.json, if this list is empty,
 * get all scriptnames from server.
 *
 * @param loginData
 */
export async function getDownloadScriptNames(loginData: nodeDoc.LoginData): Promise<nodeDoc.scriptT[]> {
    return new Promise<nodeDoc.scriptT[]>((resolve, reject) => {
        const scripts: nodeDoc.scriptT[] = readDownloadScripts();
        if (0 < scripts.length) {
            resolve(scripts);
        } else {
            nodeDoc.sdsSession(loginData, [], nodeDoc.getScriptNamesFromServer).then((_scripts) => {
                resolve(_scripts);
            }).catch((reason) => {
                reject(reason);
            });
        }
    });
}

/**
 * Read list downloadScripts from settings.json.
 */
export function readDownloadScripts(): nodeDoc.scriptT[] {
    const scripts: nodeDoc.scriptT[] = [];
    if (!vscode.workspace) {
        return scripts;
    }
    // get extension-part of settings.json
    const conf = vscode.workspace.getConfiguration('vscode-documents-scripting');

    // get scriptnames and insert in return list
    const scriptnames = conf.get('downloadScripts');
    if (scriptnames instanceof Array) {
        scriptnames.forEach((scriptname) => {
            const script: nodeDoc.scriptT = { name: scriptname };
            scripts.push(script);
        });
    }

    return scripts;
}

export function setServerScripts(scripts: nodeDoc.scriptT[]) {
    if (!vscode.workspace) {
        return;
    }
    if (!scripts || 0 === scripts.length) {
        return;
    }

    // get extension-part of settings.json
    const conf = vscode.workspace.getConfiguration('vscode-documents-scripting');

    // get scriptnames
    const scriptnames: string[] = [];
    scripts.forEach((script) => {
        scriptnames.push(script.name);
    });

    // update list in settings.json
    conf.update('serverScripts', scriptnames);
}

/**
 * Read the encrypt states of the scripts from settings.json.
 *
 * @param scripts the scripts of which we want to read the encrypt state
 */
export function readEncryptStates(scripts: nodeDoc.scriptT[]) {
    let encrypted: string[];
    let decrypted: string[];

    if (!vscode.workspace || !scripts || 0 === scripts.length) {
        return;
    }

    // get extension-part of settings.json
    const conf = vscode.workspace.getConfiguration('vscode-documents-scripting');

    // get the encrypted/decrypted lists
    const _encrypted = conf.get('encrypted');
    const _decrypted = conf.get('decrypted');
    if (_encrypted instanceof Array && _decrypted instanceof Array) {
        encrypted = _encrypted;
        decrypted = _decrypted;
    } else {
        vscode.window.showWarningMessage('Cannot read encrypted states from settings.json');
        return;
    }

    scripts.forEach((script) => {

        // check if script is in one of the lists
        // and read the state
        if (0 <= encrypted.indexOf(script.name)) {
            script.encrypted = nodeDoc.encrypted.true;
        }
        if (0 <= decrypted.indexOf(script.name)) {
            script.encrypted = nodeDoc.encrypted.decrypted;
        }
    });
}

/**
 * Store the encrypt states of the scripts in settings.json.
 *
 * @param scripts The scripts of which we want to update the encrypt states.
 */
export function updateEncryptStates(scripts: nodeDoc.scriptT[]) {
    if (!scripts || 0 === scripts.length) {
        return;
    }
    if (!vscode.workspace) {
        scripts.forEach(function(script) {
            if (script.encrypted === nodeDoc.encrypted.true) {
                vscode.window.showErrorMessage('script is encrypted! workspace required to save this state');
                return;
            }
            if (script.encrypted === nodeDoc.encrypted.decrypted) {
                vscode.window.showErrorMessage('script is decrypted! workspace required to save this state');
                return;
            }
        });
        return;
    }

    // get extension-part of settings.json
    const conf = vscode.workspace.getConfiguration('vscode-documents-scripting');

    // get the encrypted/decrypted lists
    const _encrypted = conf.get('encrypted');
    const _decrypted = conf.get('decrypted');
    let encrypted: string[];
    let decrypted: string[];
    if (_encrypted instanceof Array && _decrypted instanceof Array) {
        encrypted = _encrypted;
        decrypted = _decrypted;
    } else {
        vscode.window.showWarningMessage('Cannot write to settings.json');
        return;
    }

    scripts.forEach((script) => {
        if (true !== script.conflict) {
            const eidx = encrypted.indexOf(script.name);
            const didx = decrypted.indexOf(script.name);

            // script encrypted but not in encrypted list?
            if (nodeDoc.encrypted.true === script.encrypted) {

                // insert script into encrypted list
                if (0 > eidx) {
                    encrypted.push(script.name);
                }

                // remove script from decrypted list
                if (0 <= didx) {
                    decrypted.splice(didx, 1);
                }

                // scrypt decrypted but not in decrypted list?
            } else if (nodeDoc.encrypted.decrypted === script.encrypted) {

                // insert script into decrypted list
                if (0 > didx) {
                    decrypted.push(script.name);
                }

                // remove script form encrypted list
                if (0 <= eidx) {
                    encrypted.splice(eidx, 1);
                }

                // script unencrypted? default state
            } else if (nodeDoc.encrypted.false === script.encrypted) {

                // default state, no list required

                // just remove script from encrypted and decrypted list
                if (0 <= eidx) {
                    encrypted.splice(eidx, 1);
                }
                if (0 <= didx) {
                    decrypted.splice(didx, 1);
                }
            }
        }
    });

    // update lists in settings.json
    conf.update('encrypted', encrypted);
    conf.update('decrypted', decrypted);
}

export function readConflictModes(pscripts: nodeDoc.scriptT[]) {
    if (!pscripts || 0 === pscripts.length) {
        return;
    }
    if (!vscode.workspace) {
        return;
    }

    // get extension-part of settings.json
    const conf = vscode.workspace.getConfiguration('vscode-documents-scripting');

    const _conflictMode = conf.get('conflictMode');
    let conflictMode: string[];
    if (_conflictMode instanceof Array) {
        conflictMode = _conflictMode;
    } else {
        vscode.window.showWarningMessage('Cannot write to settings.json');
        return;
    }

    // read values
    pscripts.forEach((script) => {
        if (0 <= conflictMode.indexOf(script.name)) {
            script.conflictMode = true;
        }
    });
}

export function readHashValues(pscripts: nodeDoc.scriptT[]) {
    if (!pscripts || 0 === pscripts.length) {
        return;
    }
    if (!vscode.workspace) {
        return;
    }

    // filename of cache file CACHE_FILE
    const _documents = path.join(vscode.workspace.rootPath, '.vscode', CACHE_FILE);

    // get hash values from file as array
    let hashValues: string[];
    try {
        hashValues = fs.readFileSync(_documents, 'utf8').trim().split('\n');
    } catch (err) {
        if (err.code === 'ENOENT') {
            hashValues = [];
            nodeDoc.writeFile('', _documents);
        } else {
            return;
        }
    }

    // get extension-part of settings.json
    const conf = vscode.workspace.getConfiguration('vscode-documents-scripting');

    // get the list of scripts in conflict mode
    const _conflictMode = conf.get('conflictMode');
    let conflictMode: string[];
    if (_conflictMode instanceof Array) {
        conflictMode = _conflictMode;
    } else {
        vscode.window.showWarningMessage('Cannot write to settings.json');
        return;
    }

    // read hash values of scripts in conflict mode
    pscripts.forEach((script) => {
        if (0 <= conflictMode.indexOf(script.name)) {
            script.conflictMode = true;
            hashValues.forEach((value, idx) => {
                const scriptname = value.split(':')[0];
                if (scriptname === script.name) {
                    script.lastSyncHash = hashValues[idx].split(':')[1];
                }
            });
        }
    });
}

export function updateHashValues(pscripts: nodeDoc.scriptT[]) {
    if (!pscripts || 0 === pscripts.length) {
        return;
    }
    if (!vscode.workspace) {
        return;
    }

    // filename of cache file CACHE_FILE
    const _documents = path.join(vscode.workspace.rootPath, '.vscode', CACHE_FILE);

    // get hash values from file as array
    const hashValues = fs.readFileSync(_documents, 'utf8').trim().split('\n');

    // get extension-part of settings.json
    const conf = vscode.workspace.getConfiguration('vscode-documents-scripting');

    // get the list of scripts in conflict mode
    const _conflictMode = conf.get('conflictMode');
    let conflictMode: string[];
    if (_conflictMode instanceof Array) {
        conflictMode = _conflictMode;
    } else {
        vscode.window.showWarningMessage('Cannot write to settings.json');
        return;
    }

    // set hash values of scripts in conflict mode
    pscripts.forEach((script) => {
        if (0 <= conflictMode.indexOf(script.name) && true !== script.conflict) {
            let updated = false;
            hashValues.forEach((value, idx) => {
                const scriptname = value.split(':')[0];
                if (scriptname === script.name) {
                    hashValues[idx] = script.name + ':' + script.lastSyncHash;
                    updated = true;
                }
            });
            if (!updated) {
                hashValues.push(script.name + ':' + script.lastSyncHash);
            }
        }
    });

    // write to CACHE_FILE
    const hashValStr = hashValues.join('\n').trim();
    nodeDoc.writeFile(hashValStr, _documents);
}

export function compareScript(_path: string, scriptname: string) {
    if (!_path || !scriptname) {
        vscode.window.showErrorMessage('Select or open a file to compare');
        return;
    } else {
        const leftfile = path.join(vscode.workspace.rootPath, COMPARE_FOLDER, COMPARE_FILE_PREFIX + scriptname + '.js');
        const rightfile = path.join(_path, scriptname + '.js');
        const lefturi = vscode.Uri.file(leftfile);
        const righturi = vscode.Uri.file(rightfile);
        const title = scriptname + '.js' + ' (DOCUMENTS Server)';

        vscode.commands.executeCommand('vscode.diff', lefturi, righturi, title).then(() => {
            /* ... */
        }, (reason) => {
            vscode.window.showErrorMessage('Compare script failed ' + reason);
        });
    }
}

export async function createFolder(_path: string, hidden = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.stat(_path, (err, stats) => {
            if (err) {
                if ('ENOENT' === err.code) {
                    fs.mkdir(_path, (error) => {
                        if (error) {
                            reject(error);
                        } else {
                            if (hidden) {
                                winattr.set(_path, { hidden: true }, (reason: any) => {
                                    if (reason) {
                                        reject(reason);
                                    } else {
                                        resolve();
                                    }
                                });
                            } else {
                                resolve();
                            }
                        }
                    });
                } else {
                    reject(err);
                }
            } else {
                if (stats.isDirectory()) {
                    resolve();
                } else {
                    reject(`${_path} already exists but is not a directory`);
                }
            }
        });
    });
}

/**
 * Returns [folder:string], if fileOrFolder is a folder and
 * [folder:string, file:string] if fileOrFolder is a file.
 */
export async function getFolder(fileOrFolder: string, allowNewSubFolder = false): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        fs.stat(fileOrFolder, function(err1, stats1) {

            if (err1) {
                if (allowNewSubFolder && 'ENOENT' === err1.code && 'js' !== path.extname(fileOrFolder)) {
                    const p = fileOrFolder.split(path.sep);
                    const newfolder = p.pop();
                    const _path = p.join(path.sep);
                    fs.stat(_path, (err2, stats2) => {
                        if (err2) {
                            if ('ENOENT' === err2.code) {
                                reject('can only create a single subfolder on a valid path');
                            } else {
                                reject(err2.message);
                            }
                        } else {
                            if (stats2.isDirectory()) {
                                if (newfolder) {
                                    resolve([path.join(_path, newfolder)]);
                                } else {
                                    reject('path is empty');
                                }
                            } else {
                                reject('can only create a single subfolder on a valid path');
                            }
                        }
                    });
                } else {
                    reject(err1.message);
                }
            } else {
                if (stats1.isDirectory()) {
                    resolve([fileOrFolder]);
                } else if (stats1.isFile()) {
                    resolve([path.dirname(fileOrFolder), path.basename(fileOrFolder, '.js')]);
                } else {
                    reject('unexpected error in ' + fileOrFolder);
                }
            }
        });
    });
}

/**
 * Returns [folder], if fileOrFolder is a folder and [folder, file] if fileOrFolder is a file.
 */
export async function ensurePath(fileOrFolder: string, allowSubDir = false, withBaseName = false): Promise<string[]> {
    console.log('ensurePath');

    return new Promise<string[]>((resolve, reject) => {

        // given path must be absolute
        if (fileOrFolder) {

            // if there's a workspace, returned path must be a subfolder of rootPath
            if (!vscode.workspace || fileOrFolder.toLowerCase().startsWith(vscode.workspace.rootPath.toLowerCase())) {

                // check folder and get folder from file
                getFolder(fileOrFolder).then((retpath) => {
                    resolve(retpath);
                }).catch((reason) => {
                    reject(reason);
                });

            } else {
                reject(fileOrFolder + ' is not a subfolder of ' + vscode.workspace.rootPath);
            }
        } else {

            // set default path
            let defaultPath = '';
            if (vscode.window.activeTextEditor) {
                if (withBaseName) {
                    defaultPath = vscode.window.activeTextEditor.document.fileName;
                } else {
                    defaultPath = path.dirname(vscode.window.activeTextEditor.document.fileName);
                }
            } else if (vscode.workspace && !withBaseName) {
                defaultPath = vscode.workspace.rootPath;
            }
            // ask for path
            const _promt = withBaseName ? 'Please enter the script' : 'Please enter the folder';
            vscode.window.showInputBox({
                prompt: _promt,
                value: defaultPath,
                ignoreFocusOut: true,
            }).then((input) => {

                // input path must be absolute
                if (input) {

                    // if there's a workspace, returned path must be subfolder of rootPath
                    if (!vscode.workspace || input.toLowerCase().startsWith(vscode.workspace.rootPath.toLowerCase())) {

                        // check folder and get folder from file
                        getFolder(input, allowSubDir).then((retpath) => {
                            resolve(retpath);
                        }).catch((reason) => {
                            reject(reason);
                        });
                    } else {
                        reject(input + ' is not a subfolder of ' + vscode.workspace.rootPath);
                    }
                } else {
                    reject('no path');
                }
            });
        }
    });
}

export async function ensureScriptName(paramscript?: string): Promise<string> {
    console.log('ensureScriptName');
    return new Promise<string>((resolve, reject) => {

        if (paramscript) {
            resolve(path.basename(paramscript, '.js'));

        } else {
            let activeScript = '';
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                activeScript = path.basename(editor.document.fileName, '.js');
            }
            vscode.window.showInputBox({
                prompt: 'Please enter the script name or path',
                value: activeScript,
                ignoreFocusOut: true,
            }).then((_scriptname) => {
                if (_scriptname) {
                    resolve(path.basename(_scriptname, '.js'));
                } else {
                    reject('no script');
                }
            });
        }
    });
}

/**
 * Return script of type scriptT containing name and source code of given path or textdocument.
 *
 * @param param path to script or textdocument of script
 */
export async function ensureScript(param?: string | vscode.TextDocument): Promise<nodeDoc.scriptT> {
    console.log('ensureScript');
    return new Promise<nodeDoc.scriptT>((resolve, reject) => {

        if (param) {
            if (typeof param === 'string') {
                // param: path to script
                const ret = nodeDoc.getScript(param);
                if (typeof ret !== 'string') {
                    resolve(ret);
                } else {
                    reject(ret);
                }

            } else { // param: vscode.TextDocument
                const ret: nodeDoc.scriptT = {
                    name: path.basename(param.fileName, '.js'),
                    sourceCode: param.getText()
                };
                resolve(ret);
            }
        } else {
            let activeScript = '';
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                activeScript = editor.document.fileName;
            }
            vscode.window.showInputBox({
                prompt: 'Please enter the script name or path',
                value: activeScript,
                ignoreFocusOut: true,
            }).then((_scriptname) => {
                if (_scriptname) {
                    const ret = nodeDoc.getScript(_scriptname);
                    if (typeof ret !== 'string') {
                        resolve(ret);
                    } else {
                        reject(ret);
                    }
                } else {
                    reject('no scriptname');
                }
            });

        }
    });
}
