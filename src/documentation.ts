import * as path from 'path';
import * as vscode from 'vscode';
// tslint:disable-next-line:no-var-requires
const open = require('open');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');


// tslint:disable-next-line:no-var-requires
const classContext = require('../portalscript/documentation/classContext').classContext;
// tslint:disable-next-line:no-var-requires
const classUtil = require('../portalscript/documentation/classUtil').classUtil;

const memberAchorMappings = [
    classContext,
    classUtil
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
        const selectedWord = doc.getText(range).toLocaleLowerCase();
        let file = '';

        if (htmlFileNames.hasOwnProperty(selectedWord)) {
            file = path.join(portalScriptDocs, htmlFileNames[selectedWord]);
        } else {
            if (!browser) {
                vscode.window.showWarningMessage(`Jump to **${selectedWord}**: pecify a browser in **vscode-janus-debug.browser**`);
            }
            for (const classMapping of memberAchorMappings) {
                for (const member of classMapping) {
                    if (member.length === 3) {
                        const memberName = member[0];
                        const fileWithAnchor = member[1];
                        if (memberName.toLocaleLowerCase() === selectedWord) {
                            file = path.join(portalScriptDocs, fileWithAnchor);
                        }
                    }
                }
            }
        }

        if (file) {
            open(`file:///${file}`, browser);
        }
    }
}
