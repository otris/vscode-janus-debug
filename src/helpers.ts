import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

// tslint:disable-next-line:no-var-requires
const reduce = require('reduce-for-promises');
// tslint:disable-next-line:no-var-requires
const winattr = require('winattr');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

// like eclipse plugin
export const COMPARE_FOLDER = '.compare';
export const COMPARE_FILE_PREFIX = 'compare_';

export const CATEGORY_FOLDER_POSTFIX = '.cat';

const FORCE_UPLOAD_YES = 'Yes';
const FORCE_UPLOAD_NO = 'No';
const FORCE_UPLOAD_ALL = 'All';
const FORCE_UPLOAD_NONE = 'None';
const NO_CONFLICT = 'No conflict';

export const CACHE_FILE = '.vscode-janus-debug';
const SCRIPT_NAMES_FILE = '.documents-script-names';

const invalidCharacters = /[\\\/:\*\?"<>\|]/;

export enum autoUpload {
    yes,
    no,
    neverAsk
}

/**
 * Extends an object with another object's properties.
 *
 * Merges the properties of two objects together into the first object.
 *
 * @param target The object that will receive source's properties.
 * @param source An object carrying additional properties.
 */
export function extend<T, U>(target: T, source: U): T & U {
    const s: any = source;
    const t: any = target;
    Object.keys(s).forEach(key => t[key] = s[key]);
    return t;
}

/**
 * This type should be used in the extension instead of paths.
 * It will be easier to get the corresponding settings.json, launch.json,
 * log-files and everything that could be in a workspace folder
 */
// tslint:disable-next-line:interface-over-type-literal
export interface PathContext {
    wsFolder: vscode.WorkspaceFolder | undefined;
    fsPath: string;
    type: "js" | "ts" | "folder" | undefined;
}

/**
 * If the path is not a workspace folder, only the path is returned.
 * Because some features are possible without workspace folders.
 */
export function getPathContext(param: any, activeEditor: boolean): PathContext | undefined {
    let uri;

    if (param && param instanceof vscode.Uri) {
        uri = param;
    } else if (activeEditor && vscode.window.activeTextEditor) {
        uri = vscode.window.activeTextEditor.document.uri;
    }

    if (uri) {
        return {
            wsFolder: vscode.workspace.getWorkspaceFolder(uri),
            fsPath: uri.fsPath,
            // todo
            type: undefined
        };
    }

    return undefined;
}


/**
 * If the type of an error is not clear, call this function.
 * @param error the error with unknown type
 */
export function getErrorMsg(error: any): string {
    let msg = 'Undefined error';

    if (error instanceof Error) {
        msg = error.message;
    } else if (typeof error === 'string') {
        msg = error;
    }

    return msg;
}

/**
 * get current time as hh:mm:ss
 */
export function getTime(): string {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const hours2 = hours < 10 ? '0' + hours : hours;
    const minutes2 = minutes < 10 ? '0' + minutes : minutes;
    const seconds2 = seconds < 10 ? '0' + seconds : seconds;
    return `${hours2}:${minutes2}:${seconds2}`;
}

export function setPaths(scripts: nodeDoc.scriptT[], targetDir: string) {
    scripts.forEach(function(script: any) {
        script.path = path.join(targetDir, script.name + '.js');
    });
}





/**
 * Check, if the scripts contain scripts with same name.
 * If so, show a warning and ask the user, if they want to cancel the upload.
 * @param folderScripts the set of scripts to check
 * @return true, if the user wants to cancel the upload, false if not
 */
export function checkDuplicateScripts(folderScripts: nodeDoc.scriptT[]): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
        const duplicate = folderScripts.filter(e => e.duplicate);
        if (duplicate && duplicate.length) {
            const aShow = "Show duplicate scripts and cancel upload";
            const aContinue = "Continue anyway";
            const aCancel = "Cancel upload";
            const duplDecision = await vscode.window.showQuickPick([aShow, aContinue, aCancel], {placeHolder: `Found scripts with same name`});
            if (duplDecision !== aContinue) {
                if (duplDecision === aShow) {
                    const duplpaths = duplicate.map(e => e.path || e.name);
                    if (duplpaths) {
                        vscode.window.showQuickPick(duplpaths);
                    }
                }
                return resolve(true);
            }
        }
        return resolve(false);
    });
}





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
export function categoriesToFolders(conf: vscode.WorkspaceConfiguration, serverInfo: nodeDoc.ConnectionInformation, scripts: nodeDoc.scriptT[], targetDir: string) {

    // get category flag
    const categories = conf.get('categories', false);
    if (!categories) {
        return false;
    }

    // move this check to node-documents-scripting!
    if (Number(serverInfo.documentsVersion) < Number(nodeDoc.VERSION_CATEGORIES)) {
        vscode.window.showWarningMessage(`Using categories only available with server version ${nodeDoc.VERSION_CATEGORIES} or higher`);
        return;
    }

    let invalidName;
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
                    invalidName = script.category;
                } else {
                    script.path = path.join(targetDir, script.category + CATEGORY_FOLDER_POSTFIX, script.name + '.js');
                }
            }
        });
    }

    if (invalidName) {
        vscode.window.showWarningMessage(`Cannot create folder from category '${invalidName}' - please remove special characters`);
    }
}


/**
 * @param serverInfo to be removed
 */
export function foldersToCategories(conf: vscode.WorkspaceConfiguration, serverInfo: nodeDoc.ConnectionInformation, scripts: nodeDoc.scriptT[]) {

    // get category flag
    const categories = conf.get('categories', false);
    if (!categories) {
        return false;
    }

    // remove this check! this is already checked in node-documents-scripting!
    if (Number(serverInfo.documentsVersion) < Number(nodeDoc.VERSION_CATEGORIES)) {
        vscode.window.showWarningMessage(`Using categories only available with server version ${nodeDoc.VERSION_CATEGORIES} or higher`);
        return;
    }

    scripts.forEach((script: nodeDoc.scriptT) => {
        if (script.path) {
            script.category = getCategoryFromPath(script.path);
        }
    });
}



/**
 * Two things for script are checked:
 *
 * 1) has the category changed?
 * because the category is created from the folder
 * just make sure, that the category is not changed by mistake
 *
 * 2) has the source code on server changed?
 * this is only important if more than one people work on
 * the same server
 *
 * @param script user is asked, if this script should be uploaded
 * @param all true, if user selected 'all scripts should be uploaded'
 * @param none true, if user selected 'no script should be uploaded'
 * @param singlescript true, if user is asked for only one script
 * @param categories true, if the category setting is set
 */
export async function askForUpload(script: nodeDoc.scriptT, all: boolean, none: boolean, singlescript: boolean, categories: boolean): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {

        // if lastSyncHash is not set, then confict has been set to true
        // so actually the case !conflict && !lastSyncHash is not possible here
        if (!script.conflict && script.lastSyncHash) {
            return resolve(NO_CONFLICT);
        }

        let answers = [FORCE_UPLOAD_YES, FORCE_UPLOAD_NO];
        let question;
        let answer;

        if (all) {
            return resolve(FORCE_UPLOAD_ALL);
        }
        if (none) {
            return resolve(FORCE_UPLOAD_NONE);
        }

        // first check category
        if (script.conflict && (script.conflict & nodeDoc.CONFLICT_CATEGORY)) {
            // only show warning, if category feature is used,
            // if it's not used, categories will never be changed on server
            // and the warning should be omitted in this case
            if (categories) {
                question = `Category of ${script.name} is different on server, upload anyway?`;
                answer = await vscode.window.showQuickPick(answers, { placeHolder: question });
            } else {
                answer = FORCE_UPLOAD_YES;
            }
        }

        // if script should not be force uploaded
        // we do not have to check the source code
        if (answer === FORCE_UPLOAD_NO) {
            return resolve(FORCE_UPLOAD_NO);
        }

        // now check source code
        if (script.conflict && (script.conflict & nodeDoc.CONFLICT_SOURCE_CODE)) {
            if (script.encrypted === 'true') {
                question = `${script.name} cannot be decrypted, source code might have been changed on server, upload anyway?`;
            } else if (script.lastSyncHash) {
                question = `Source code of ${script.name} has been changed on server, upload anyway?`;
            } else {
                // lastSyncHash not set, so we have no information if the source code on server has been changed
                question = `Source code of ${script.name} might have been changed on server, upload anyway?`;
            }
            if (!singlescript) {
                answers = [FORCE_UPLOAD_YES, FORCE_UPLOAD_NO, FORCE_UPLOAD_ALL, FORCE_UPLOAD_NONE];
            }
            answer = await vscode.window.showQuickPick(answers, { placeHolder: question });
        }

        return resolve(answer);
    });
}



/**
 * Ask user for all conflicted scripts if they should be force uploaded or if upload should
 * be cancelled
 *
 * @param param List of potentially conflicted scripts.
 *
 * @return Two arrays containing scripts of input array.
 * 1. array: scripts that are already uploaded 2. array: scripts that user marked to force upload.
 */
export async function ensureForceUpload(conf: vscode.WorkspaceConfiguration, scripts: nodeDoc.scriptT[]): Promise<[nodeDoc.scriptT[], nodeDoc.scriptT[]]> {
    return new Promise<[nodeDoc.scriptT[], nodeDoc.scriptT[]]>((resolve, reject) => {
        const forceUpload: nodeDoc.scriptT[] = [];
        const noConflict: nodeDoc.scriptT[] = [];

        let all = conf.get('forceUpload', false);
        let none = false;
        const singlescript = (1 === scripts.length);
        const categories = conf.get('categories', false);

        // todo: using async/await here probably makes the whole procedure
        // a bit simpler
        return reduce(scripts, (numScripts: number, script: any): Promise<number> => {
            return askForUpload(script, all, none, singlescript, categories).then((value) => {
                if (NO_CONFLICT === value) {
                    noConflict.push(script);
                } else if (FORCE_UPLOAD_ALL === value) {
                    script.forceUpload = true;
                    script.conflict = 0;
                    forceUpload.push(script);
                    all = true;
                } else if (FORCE_UPLOAD_YES === value) {
                    script.forceUpload = true;
                    script.conflict = 0;
                    forceUpload.push(script);
                } else if (FORCE_UPLOAD_NO === value) {
                    // do nothing ...
                } else {
                    // escape or anything should behave as if the user answered 'None'
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
export async function ensureUploadOnSave(conf: vscode.WorkspaceConfiguration, param: string): Promise<autoUpload> {
    return new Promise<autoUpload>((resolve, reject) => {
        let always: string[] = [];
        let never: string[] = [];

        if (0 === param.length) {
            return reject('Scriptname is missing');
        }

        const scriptname = path.basename(param, '.js');

        const _always = conf.get('uploadOnSave');
        const _never = conf.get('uploadManually');
        if (_always instanceof Array && _never instanceof Array) {
            always = _always;
            never = _never;
        } else {
            vscode.window.showWarningMessage('Cannot read upload mode from settings.json');
            return reject();
        }
        if (0 <= never.indexOf(scriptname)) {
            resolve(autoUpload.no);
        } else if (0 <= always.indexOf(scriptname)) {
            resolve(autoUpload.yes);
        } else {
            const QUESTION: string = `Upload script ${scriptname}?`;
            const YES: string = `Yes`;
            const NO: string = `No`;
            const ALWAYS: string = `Always upload ${scriptname} automatically`;
            const NEVER: string = `Never upload ${scriptname} automatically`;
            const NEVERASK: string = `Never upload scripts automatically`;
            vscode.window.showQuickPick([YES, NO, ALWAYS, NEVER, NEVERASK], { placeHolder: QUESTION }).then((answer) => {
                if (YES === answer) {
                    resolve(autoUpload.yes);
                } else if (NO === answer) {
                    resolve(autoUpload.no);
                } else if (ALWAYS === answer) {
                    always.push(scriptname);
                    conf.update('uploadOnSave', always);
                    resolve(autoUpload.yes);
                } else if (NEVER === answer) {
                    never.push(scriptname);
                    conf.update('uploadManually', never);
                    resolve(autoUpload.no);
                } else if (NEVERASK === answer) {
                    conf.update('uploadOnSaveGlobal', false, true);
                    resolve(autoUpload.neverAsk);
                }
            });
        }
    });
}


/**
 * Read list downloadScriptNames
 */
export function getDownloadScriptNamesFromList(): nodeDoc.scriptT[] {
    let scriptnames: string[];
    let scripts: nodeDoc.scriptT[];

    if (!vscode.workspace || !vscode.workspace.rootPath) {
        return [];
    }

    try {
        const file = path.join(vscode.workspace.rootPath, SCRIPT_NAMES_FILE);
        scriptnames = fs.readFileSync(file, 'utf8').trim().split(os.EOL);
    } catch (err) {
        return [];
    }


    // get scriptnames and insert in return list
    scripts = [];
    if ((scriptnames instanceof Array) && (0 < scriptnames.length)) {
        scriptnames.forEach((scriptname) => {
            const script = new nodeDoc.scriptT(scriptname.trim(), '');
            scripts.push(script);
        });
    }

    return scripts;
}

export function writeScriptNamesToFile(scripts: nodeDoc.scriptT[]) {
    if (!vscode.workspace || !vscode.workspace.rootPath) {
        return;
    }
    if (!scripts || 0 === scripts.length) {
        return;
    }

    // get scriptnames
    const scriptnames: string[] = [];
    scripts.forEach((script) => {
        scriptnames.push(script.name);
    });

    const scriptnamesstr = scriptnames.join(os.EOL) + os.EOL;
    const file = path.join(vscode.workspace.rootPath, SCRIPT_NAMES_FILE);
    fs.writeFileSync(file, scriptnamesstr);

    vscode.workspace.openTextDocument(vscode.Uri.file(file)).then((doc) => {
        vscode.window.showTextDocument(doc);
    });
}



export function setScriptInfoJson(conf: vscode.WorkspaceConfiguration, scripts: nodeDoc.scriptT[]) {
    if (!vscode.workspace.rootPath) {
        return;
    }
    const scriptParameters = conf.get('scriptParameters', false);
    if (!scriptParameters) {
        return;
    }
    // loginData.language = nodeDoc.Language.English;

    const rootPath = vscode.workspace.rootPath;
    scripts.forEach((script) => {
        const infoFile = path.join(rootPath, '.scriptParameters', script.name + '.json');
        try {
            script.parameters = fs.readFileSync(infoFile, 'utf8');
        } catch (err) {
            //
        }
    });
}

export function getScriptInfoJson(conf: vscode.WorkspaceConfiguration, scripts: nodeDoc.scriptT[]) {
    const scriptParameters = conf.get('scriptParameters', false);
    if (!scriptParameters) {
        return;
    }
    // loginData.language = nodeDoc.Language.English;

    scripts.forEach((script) => {
        script.downloadParameters = true;
    });
}

export async function writeScriptInfoJson(conf: vscode.WorkspaceConfiguration, scripts: nodeDoc.scriptT[]) {
    if (!vscode.workspace.rootPath) {
        return;
    }
    const scriptParameters = conf.get('scriptParameters', false);
    if (!scriptParameters) {
        return;
    }
    const rootPath = vscode.workspace.rootPath;
    scripts.forEach(async (script) => {
        if (script.parameters) {
            const parpath = path.join(rootPath, '.scriptParameters', script.name + '.json');
            await nodeDoc.writeFileEnsureDir(script.parameters, parpath);
        }
    });
}




export function readEncryptionFlag(conf: vscode.WorkspaceConfiguration, pscripts: nodeDoc.scriptT[]) {
    if (0 === pscripts.length) {
        return;
    }

    // write values
    const encryptOnUpload = conf.get('encryptOnUpload');
    const encryptionOnUpload = conf.get('encryptionOnUpload');
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



export function setConflictModes(conf: vscode.WorkspaceConfiguration, pscripts: nodeDoc.scriptT[]) {
    if (!pscripts || 0 === pscripts.length) {
        return;
    }
    if (!vscode.workspace) {
        return;
    }

    const forceUpload = conf.get('forceUpload', false);

    // read values
    pscripts.forEach((script) => {
        if (forceUpload) {
            script.conflictMode = false;
        }
    });
}

/**
 * Reads the conflict mode and hash value of any script in pscripts.
 */
export function readHashValues(conf: vscode.WorkspaceConfiguration, pscripts: nodeDoc.scriptT[], server: string) {
    if (!pscripts || 0 === pscripts.length) {
        return;
    }

    if (!vscode.workspace.rootPath) {
        return;
    }

    if (conf.get('vscode-janus-debug.forceUpload', false)) {
        return;
    }

    // filename of cache file CACHE_FILE
    const hashValueFile = path.join(vscode.workspace.rootPath, CACHE_FILE);

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

export function updateHashValues(conf: vscode.WorkspaceConfiguration, pscripts: nodeDoc.scriptT[], server: string) {
    if (!pscripts || 0 === pscripts.length) {
        return;
    }
    if (!vscode.workspace || !vscode.workspace.rootPath) {
        return;
    }

    if (conf.get('vscode-janus-debug.forceUpload', false)) {
        return;
    }

    // filename of cache file CACHE_FILE
    const hashValueFile = path.join(vscode.workspace.rootPath, CACHE_FILE);

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


export function scriptLog(conf: vscode.WorkspaceConfiguration, scriptOutput: string | undefined) {
    if (!scriptOutput || 0 >= scriptOutput.length) {
        return;
    }
    const log: any = conf.get('scriptLog');
    if (!log || !log.returnValue) {
        return;
    }
    let returnValue = '';
    const lines = scriptOutput.replace('\r', '').split('\n');
    lines.forEach(function(line) {
        if (line.startsWith('Return-Value: ')) {
            returnValue = line.substr(14) + os.EOL;
        }
    });
    if (returnValue.length > 0 && log.fileName && vscode.workspace.rootPath) {
        const fileName = log.fileName.replace(/[$]{workspaceRoot}/, vscode.workspace.rootPath);
        if (conf.get('scriptLog.append', false)) {
            fs.writeFileSync(fileName, returnValue, {flag: "a"});
        } else {
            fs.writeFileSync(fileName, returnValue);
        }
    }
}




export async function ensureHiddenFolder(_path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.stat(_path, (err: any, stats: any) => {
            if (err) {
                if ('ENOENT' === err.code) {
                    fs.mkdir(_path, (error: any) => {
                        if (error) {
                            reject(error);
                        } else {
                            winattr.set(_path, { hidden: true }, (reason: any) => {
                                if (reason) {
                                    reject(reason);
                                } else {
                                    resolve();
                                }
                            });
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
 * Check, if the path exists and return the folder path.
 *
 * Todo: allowCreateFolder should be removed, it is very simple
 * to create a folder in VS Code manually and then execute
 * the command on the created folder
 */
async function getDir(scriptPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        // todo remove
        const allowCreateFolder = false;
        fs.stat(scriptPath, function(err1: any, stats1: any) {
            if (err1) {
                if (allowCreateFolder && 'ENOENT' === err1.code && 'js' !== path.extname(scriptPath)) {
                    const p = scriptPath.split(path.sep);
                    const newfolder = p.pop();
                    const _path = p.join(path.sep);
                    fs.stat(_path, (err2: any, stats2: any) => {
                        if (err2) {
                            if ('ENOENT' === err2.code) {
                                reject('can only create a single subfolder on a valid path');
                            } else {
                                reject(err2.message);
                            }
                        } else {
                            if (stats2.isDirectory()) {
                                if (newfolder) {
                                    resolve(path.join(_path, newfolder));
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
                    resolve(scriptPath);
                } else if (stats1.isFile()) {
                    resolve(path.dirname(scriptPath));
                } else {
                    reject('Invalid path: ' + scriptPath);
                }
            }
        });
    });
}





export async function ensurePath(fileOrDir: string | undefined, allowSubDir = false): Promise<string> {

    return new Promise<string>((resolve, reject) => {

        if (!vscode.workspace.workspaceFolders) {
            return reject('First open a workspace folder please!');
        }

        if (fileOrDir) {

            getDir(fileOrDir).then((returnDir) => {
                return resolve(returnDir);
            }).catch((reason: string) => {
                return reject(reason);
            });
        } else {

            // set default path
            let defaultPath = '';
            if (vscode.window.activeTextEditor) {
                defaultPath = path.dirname(vscode.window.activeTextEditor.document.fileName);
            } else {
                defaultPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            }

            // ask for path
            const showText = 'Enter the folder please';
            vscode.window.showInputBox({
                prompt: showText,
                value: defaultPath,
                ignoreFocusOut: true,
            }).then(async (input: string | undefined) => {
                if (!input) {
                    return reject('Invalid input');
                }

                let uri;
                let returnDir;
                try {
                    returnDir = await getDir(input);

                    // we need the uri to check if the input
                    // is a workspace folder
                    uri = vscode.Uri.parse(returnDir);
                } catch (err) {
                    return reject(err);
                }

                // is the input a workspace folder?
                if (vscode.workspace.getWorkspaceFolder(uri)) {
                    return reject(`${input} is not a workspacefolder`);
                }

                return resolve(returnDir);
            });
        }
    });
}





export async function ensureScriptName(paramScript?: string, serverScripts: string[] = []): Promise<string> {
    return new Promise<string>((resolve, reject) => {

        if (paramScript && '.js' === path.extname(paramScript)) {
            resolve(path.basename(paramScript, '.js'));

        } else {
            let activeScript = '';
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                activeScript = path.basename(editor.document.fileName, '.js');
            }
            if (0 === serverScripts.length) {
                vscode.window.showInputBox({
                    prompt: 'Please enter the script name or path',
                    value: activeScript,
                    ignoreFocusOut: true,
                }).then((scriptName) => {
                    if (scriptName) {
                        resolve(path.basename(scriptName, '.js'));
                    } else {
                        reject('no script');
                    }
                });
            } else {
                vscode.window.showQuickPick(
                    serverScripts
                ).then((scriptName) => {
                    if (scriptName) {
                        resolve(scriptName);
                    } else {
                        reject('no script');
                    }
                });
            }
        }
    });
}

/**
 * Create script-type with name and sourceCode from file.
 *
 * @param file Scriptname, full path.
 */
function getScript(file: string, extname: '.js' | '.ts' = '.js'): nodeDoc.scriptT | string {
    if (!file || extname !== path.extname(file)) {
        const lang = extname === '.js' ? 'javascript' : 'typescript';
        return `only ${lang} files allowed`;
    }
    if (!fs.existsSync(file)) {
        return `file ${file} does not exist`;
    }
    try {
        const name = path.basename(file, extname);
        const scriptpath = file;
        const localCode = fs.readFileSync(file, 'utf8');
        return new nodeDoc.scriptT(name, scriptpath, localCode);
    } catch (err) {
        return err;
    }
}


/**
 * Return script of type scriptT containing name and source code of given path or textdocument.
 *
 * @param param path to script or textdocument of script
 */
export async function ensureScript(param?: string | vscode.TextDocument, extname: '.js' | '.ts' = '.js'): Promise<nodeDoc.scriptT> {
    return new Promise<nodeDoc.scriptT>((resolve, reject) => {

        if (param) {
            if (typeof param === 'string') { // param: path to script
                const retscript = getScript(param, extname);
                if (retscript instanceof nodeDoc.scriptT) {
                    return resolve(retscript);
                } else {
                    return reject(retscript);
                }

            } else { // param: vscode.TextDocument
                const ret: nodeDoc.scriptT = new nodeDoc.scriptT(path.basename(param.fileName, extname), param.fileName, param.getText());
                return resolve(ret);
            }
        } else {
            let activeScript = '';
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                activeScript = editor.document.fileName;
            }
            vscode.window.showInputBox({
                prompt: 'Please enter the script path',
                value: activeScript,
                ignoreFocusOut: true,
            }).then((_scriptname) => {
                if (_scriptname) {
                    const retscript = getScript(_scriptname);
                    if (retscript instanceof nodeDoc.scriptT) {
                        return resolve(retscript);
                    } else {
                        return reject(retscript);
                    }
                } else {
                    return reject('no scriptname');
                }
            });

        }
    });
}

export function showWarning(loginData: nodeDoc.ConnectionInformation) {
    if (0 < loginData.lastWarning.length) {
        vscode.window.showWarningMessage(loginData.lastWarning);
        loginData.lastWarning = '';
    }
}
