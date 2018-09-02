/**
 * Special file for functions that need interactive input from user.
 * Althogh this functions should be tested automatically (further work required),
 * it's important to test them manuallly.
 */


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
export async function ensureUploadOnSave(conf: vscode.WorkspaceConfiguration, param: string): Promise<autoUpload> {
    return new Promise<autoUpload>((resolve, reject) => {
        let always: string[] = [];
        let never: string[] = [];

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
