import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

// tslint:disable-next-line:no-var-requires
const winattr = require('winattr');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

// like eclipse plugin
export const COMPARE_FOLDER = '.compare';
export const COMPARE_FILE_PREFIX = 'compare_';

export const CATEGORY_FOLDER_POSTFIX = '.cat';


export const CACHE_FILE = '.vscode-janus-debug';
const SCRIPT_NAMES_FILE = '.documents-script-names';



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
 * Todo: allowCreateFolder should be removed, the extension
 * will not create folders from user input, folders are
 * only created for categories
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
