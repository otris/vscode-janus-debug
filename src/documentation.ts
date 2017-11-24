import * as path from 'path';
import * as vscode from 'vscode';
// tslint:disable-next-line:no-var-requires
const open = require('open');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');
// tslint:disable-next-line:no-var-requires
const mapping = require('../portalscript/documentation/methodMapping').mapping;







const availableBrowsers = [
    "iexplore",
    "mozilla",
    "chrome",
    "safari",
    "firefox"
];


export async function viewDocumentation() {
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
        const selectedWordU = doc.getText(range);
        const selectedWord = selectedWordU.toLocaleLowerCase();
        const moduleHtml = path.join(portalScriptDocs, 'module-' + selectedWord + '.html');
        const classHtml = path.join(portalScriptDocs, selectedWordU + '.html');
        const mappingMember = mapping[selectedWordU];
        let file = '';

        // function or member selected?
        if (mappingMember && mappingMember.length > 0) {
            if (!browser) {
                vscode.window.showWarningMessage(`Jump to **${selectedWord}**: pecify a browser in **vscode-janus-debug.browser**`);
            }
            if (mappingMember.length === 1) {
                const className = mappingMember[0].replace(':', '-') + '.html';
                file = path.join(portalScriptDocs, className + '#' + selectedWordU);
            } else {
                const question = `Found ${selectedWordU} in several classes, select one class please!`;
                let result = await vscode.window.showQuickPick(mappingMember, {placeHolder: question});
                if (result) {
                    result = result.replace(':', '-') + '.html';
                    file = path.join(portalScriptDocs, result + '#' + selectedWordU);
                }
            }

        // module selected?
        } else if (fs.existsSync(classHtml)) {
            file = classHtml;

        // class or interface selected?
        } else if (fs.existsSync(moduleHtml)) {
            file = moduleHtml;
        }

        // no portal script member selected, open main documentation
        if (!file || file.length === 0) {
            const question = 'Selected text not found in documentation, open main documentation';
            file = path.join(portalScriptDocs, 'index.html');
        }

        if (file) {
            open(`file:///${file}`, browser);
        }
    }
}
