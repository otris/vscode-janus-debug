import * as path from 'path';
import * as vscode from 'vscode';
// tslint:disable-next-line:no-var-requires
const open = require('open');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

const availableBrowsers = [
    "iexplore",
    "mozilla",
    "chrome",
    "safari",
    "firefox"
];


export function viewDocumentation() {
    const thisExtension: vscode.Extension<any> | undefined = vscode.extensions.getExtension("otris-software.vscode-janus-debug");
    if (thisExtension === undefined) {
        return;
    }
    const extensionPath = thisExtension.extensionPath;
    const portalScriptDocs = path.join(extensionPath, 'portalscript', 'documentation');
    const activeFile = vscode.window.activeTextEditor;
    const config = vscode.workspace.getConfiguration('vscode-janus-debug');
    let browser: string | undefined = config.get('browser', '');
    if (browser.length > 0 && 0 > availableBrowsers.indexOf(browser)) {
        vscode.window.showWarningMessage(`The browser ${browser} is not yet supported!`);
        browser = undefined;
    }

    if (portalScriptDocs && activeFile) {
        const doc = activeFile.document;
        const pos = activeFile.selection.active;
        if (!pos) {
            vscode.window.showWarningMessage(`Right click on a word (e.g. **context** or **util**) to get the documentation`);
            return;
        }
        const range = doc.getWordRangeAtPosition(pos);
        if (!range) {
            vscode.window.showWarningMessage(`Right click on a word (e.g. **context** or **util**) to get the documentation`);
            return;
        }
        const word = doc.getText(range).toLocaleLowerCase();
        let file;
        let anchor;
        switch (word) {
            case 'context':
                file = path.join(portalScriptDocs, 'classContext.html');
                break;
            case 'util':
                file = path.join(portalScriptDocs, 'classUtil.html');
                break;
            case 'docfile':
                file = path.join(portalScriptDocs, 'classDocFile.html');
                break;
            case 'systemuser':
                file = path.join(portalScriptDocs, 'classSystemUser.html');
                break;
            case 'systemuseriterator':
                file = path.join(portalScriptDocs, 'classSystemUserIterator.html');
                break;
            case 'dochit':
                file = path.join(portalScriptDocs, 'classDocHit.html');
                break;
            case 'hitresultset':
                file = path.join(portalScriptDocs, 'classHitResultset.html');
                break;
            case 'returntype':
                anchor = 'adc5ff13c1317ccf80f07fb76b4dfb4da';
                file = path.join(portalScriptDocs, 'classContext.html');
                break;
            case 'convertdatetostring':
                anchor = 'adf2adb3ae40357ec636ff66cf2261f43';
                file = path.join(portalScriptDocs, 'classUtil.html');
                break;
            case 'convertstringtodate':
                anchor = 'a77906d2baa7d7c2a2c9ddc36c0f36538';
                file = path.join(portalScriptDocs, 'classUtil.html');
                break;
            default:
                // todo: quickpick
                vscode.window.showWarningMessage(`Documentation available for context, returnType, util, DocFile, SystemUser, HitResultset, ...`);
        }
        if (file) {
            if (anchor) {
                if (!browser) {
                    vscode.window.showWarningMessage(`Jump to **${word}**: pecify a browser in **vscode-janus-debug.browser**`);
                }
                open(`file:///${file}#${anchor}`, browser);
            } else {
                open(`file:///${file}`, browser);
            }
        }
    }
}
