/**
 * Special file for functions that need interactive input from user.
 * Althogh this functions should be tested automatically (further work required),
 * it's important to test them manuallly.
 */


import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import * as path from 'path';
import * as vscode from 'vscode';

// tslint:disable-next-line:no-var-requires
const reduce = require('reduce-for-promises');

export const FORCE_UPLOAD_YES = 'Yes';
export const FORCE_UPLOAD_NO = 'No';
export const FORCE_UPLOAD_ALL = 'All';
export const FORCE_UPLOAD_NONE = 'None';
export const NO_CONFLICT = 'No conflict';

export enum autoUpload {
    yes,
    no,
    neverAsk
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
async function askForUpload(script: nodeDoc.scriptT, all: boolean, none: boolean, singlescript: boolean, categories: boolean): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {

        if (!script.conflict) {
            if (script.lastSyncHash) {
                return resolve(NO_CONFLICT);
            } else {
                // if !lastSyncHash -> we have no information about the script
                // but actually conflict should have been set to true in this case
            }
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
            } else if (script.lastSyncHash && script.serverCode) {
                    question = `${script.name} has been changed on server, upload anyway?`;
            } else if (script.lastSyncHash && !script.serverCode) {
                    question = `${script.name} has been deleted on server, upload anyway?`;
            } else if (!script.lastSyncHash && script.serverCode) {
                // serverCode set -> script is on server
                // lastSyncHash not set -> we don't know if source code on server has been changed
                question = `${script.name} might have been changed on server, upload anyway?`;
            } else if (!script.lastSyncHash && !script.serverCode) {
                // serverCode not set -> script not on server
                // lastSyncHash not set -> script not known
                // ==> probably a new script is created, so don't ask
                answer = FORCE_UPLOAD_YES;
            }
            if (!singlescript) {
                answers = [FORCE_UPLOAD_YES, FORCE_UPLOAD_NO, FORCE_UPLOAD_ALL, FORCE_UPLOAD_NONE];
            }
            if (question) {
                answer = await vscode.window.showQuickPick(answers, { placeHolder: question });
            }
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
export async function ensureForceUpload(confForceUpload: boolean, confCategories: boolean, scripts: nodeDoc.scriptT[]): Promise<[nodeDoc.scriptT[], nodeDoc.scriptT[]]> {
    return new Promise<[nodeDoc.scriptT[], nodeDoc.scriptT[]]>((resolve, reject) => {
        const forceUpload: nodeDoc.scriptT[] = [];
        const noConflict: nodeDoc.scriptT[] = [];

        let all = confForceUpload;
        let none = false;
        const singlescript = (1 === scripts.length);

        // todo: using async/await here probably makes the whole procedure
        // a bit simpler
        return reduce(scripts, (numScripts: number, script: any): Promise<number> => {
            return askForUpload(script, all, none, singlescript, confCategories).then((value) => {
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
export async function ensureUploadOnSave(conf: vscode.WorkspaceConfiguration, scriptname: string): Promise<autoUpload> {
    return new Promise<autoUpload>(async (resolve, reject) => {

        const always: string[] = conf.get('uploadOnSave', []);
        const never: string[] = conf.get('uploadManually', []);
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
            const answer = await vscode.window.showQuickPick([YES, NO, ALWAYS, NEVER, NEVERASK], { placeHolder: QUESTION });
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
        }
    });
}








/**
 * Check, if the scripts contain scripts with same name.
 * If so, show a warning and ask the user, if they want to cancel the upload.
 * @param folderScripts the set of scripts to check
 * @return true, if the user wants to cancel the upload, false if not
 */
function checkDuplicateScripts(folderScripts: nodeDoc.scriptT[]): Promise<boolean> {
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


export async function getXMLExportClass(): Promise<string | undefined> {
    const exportClass = await vscode.window.showQuickPick(["DlcFileType", "PortalScript"], {placeHolder: "Select class", ignoreFocusOut: true});
    return Promise.resolve(exportClass);
}

export async function createXMLExportFilter(className: string, names: string[]): Promise<nodeDoc.xmlExport | nodeDoc.xmlExport[] | undefined> {
    return new Promise<nodeDoc.xmlExport | nodeDoc.xmlExport[] | undefined>(async (resolve, reject) => {
        const all = "<All in seperate files>";
        const allInOne = "<All in one file>";
        const fromJson = "<Get names from JSON>";
        const items = [all, allInOne, fromJson].concat(names);
        const prefix = (className === "DlcFileType") ? "Title=" : "Name=";


        const selected = await vscode.window.showQuickPick(items);
        if (selected === all) {
            const xmlExports = names.map((name, i) => {
                return new nodeDoc.xmlExport(className, prefix + `'${names[i]}'`, names[i]);
            });
            return resolve(xmlExports);
        } else if (selected === allInOne) {
            const xmlExport = new nodeDoc.xmlExport(className, "", "");
            return resolve(xmlExport);
        } else if (selected === fromJson) {
            const uri = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri : undefined;
            let jsonUri;
            if (uri && path.extname(uri.fsPath) === ".json") {
                jsonUri = uri.fsPath;
            }
            const jsonFile = await vscode.window.showInputBox({prompt: "Insert Path to JSON File", ignoreFocusOut: true, value: jsonUri});
            if (jsonFile === undefined) {
                return resolve(undefined);
            }
            const jsonString = fs.readFileSync(jsonFile, 'utf8');
            const jsonObj = JSON.parse(jsonString);
            const keys = Object.keys(jsonObj);
            if (keys.length === 0) {
                vscode.window.showWarningMessage("Expected array in JSON file");
                return resolve(undefined);
            } else {
                let jsonArray;
                let label;
                if (keys.length > 1) {
                    label = await vscode.window.showQuickPick(keys);
                    jsonArray = label ? jsonObj[label] : undefined;
                } else {
                    label = keys[0];
                    jsonArray = jsonObj[label];
                }
                if (jsonArray !== undefined && jsonArray instanceof Array) {
                    // e.g. filter = "(Name='crmNote'||Name='crmCase')"
                    const titles = jsonArray.map((name) => {
                        return prefix + `'${name}'`;
                    });
                    const filter = "(" + titles.join("||") + ")";
                    const xmlExport = new nodeDoc.xmlExport(className, filter, (label ? label : ""));
                    return resolve(xmlExport);
                } else {
                    vscode.window.showWarningMessage("Expected array in JSON file");
                    return resolve(undefined);
                }
            }
        } else if (selected) {
            const xmlExports = [];
            xmlExports.push(new nodeDoc.xmlExport(className, prefix + `'${selected}'`, selected));
            return resolve(xmlExports);
        }
        return resolve(undefined);
    });
}


export async function maintenanceOperation(): Promise<string | undefined> {
    const operation = await vscode.window.showInputBox();
    return Promise.resolve(operation);
}

export async function showMaintenanceResult(returnValue: string | undefined) {
    if (returnValue && returnValue.length > 0) {
        await vscode.window.showInformationMessage(returnValue, {modal: true});
    }
}
