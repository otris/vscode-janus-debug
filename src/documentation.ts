import * as path from 'path';
import * as vscode from 'vscode';
// tslint:disable-next-line:no-var-requires
const open = require('open');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');
// tslint:disable-next-line:no-var-requires
const classContext = require('../portalscript/documentation/classContext').classContext;

const availableBrowsers = [
    "iexplore",
    "mozilla",
    "chrome",
    "safari",
    "firefox"
];



interface HtmlFileNames {
    [key: string]: string;
}

const htmlFileNames: HtmlFileNames = {
    context: 'classContext.html',
    util: 'classUtil.html',
    docfile: 'classDocFile.html',
    systemuser: 'classSystemUser.html',
    systemuseriterator: 'classSystemUserIterator.html',
    dochit: 'classDocHit.html',
    hitresultset: 'classHitResultset.html',
    fileresultset: 'classFileResultset.html'
};


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
        let file = '';
        const anchor = '';




        if (htmlFileNames.hasOwnProperty(word)) {
            file = path.join(portalScriptDocs, htmlFileNames[word]);
        } else {
            if (!browser) {
                vscode.window.showWarningMessage(`Jump to **${word}**: pecify a browser in **vscode-janus-debug.browser**`);
            }
            classContext.forEach((line: string[]) => {
                if (line[0].toLocaleLowerCase() === word) {
                    // tslint:disable-next-line:no-string-literal
                    file = path.join(portalScriptDocs, line[1]);
                }
            });
        }

        if (file) {
            open(`file:///${file}`, browser);
        }
    }
}
