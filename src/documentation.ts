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
    const portalScriptDocs = path.join(extensionPath, 'portalscript', 'documentation', 'portalscript-api.html');
    const activeFile = vscode.window.activeTextEditor;
    const config = vscode.workspace.getConfiguration('vscode-janus-debug');
    let browser: string | undefined = config.get('browser', '');
    if (browser.length > 0 && 0 > availableBrowsers.indexOf(browser)) {
        vscode.window.showWarningMessage(`The browser ${browser} is not yet supported!`);
        browser = undefined;
    }

    if (portalScriptDocs && activeFile) {
        let file = '';
        const doc = activeFile.document;
        const pos = activeFile.selection.active;
        if (doc && pos) {
            const range = doc.getWordRangeAtPosition(pos);
            if (range) {
                const selectedWord = doc.getText(range);
                const selectedWordL = selectedWord.toLocaleLowerCase();
                const moduleName: string = (mapping['class-names'].indexOf('module:' + selectedWordL) >= 0) ? 'module:' + selectedWordL : '';
                const namespaceName: string = (mapping['class-names'].indexOf(selectedWordL) >= 0) ? 'module:' + selectedWordL : '';
                const className: string = (mapping['class-names'].indexOf(selectedWord) >= 0) ? selectedWord : '';
                const functionOrMember: string[] = mapping[selectedWord];

                // function or member selected?
                if (functionOrMember && functionOrMember.length > 0) {
                    if (!browser) {
                        vscode.window.showWarningMessage(`Jump to **${selectedWordL}**: pecify a browser in **vscode-janus-debug.browser**`);
                    }
                    if (functionOrMember.length === 1) {
                        const classNameHtml = functionOrMember[0].replace(':', '-') + '.html';
                        file = portalScriptDocs + '#' + classNameHtml + '&' + selectedWord;
                    } else {
                        const question = `Found ${selectedWord} in several classes, select one class please!`;
                        let result = await vscode.window.showQuickPick(functionOrMember, {placeHolder: question});
                        if (result) {
                            result = result.replace(':', '-') + '.html';
                            file = portalScriptDocs + '#' + result + '&' + selectedWord;
                        }
                    }

                // module selected?
                } else if (moduleName.length > 0) {
                    const moduleNameHtml = moduleName.replace(':', '-') + '.html';
                    file = portalScriptDocs + '#' + moduleNameHtml;

                // class or interface selected?
                } else if (className.length > 0) {
                    const classNameHtml = className + '.html';
                    file = portalScriptDocs + '#' + classNameHtml;

                // namespace selected?
                } else if (namespaceName.length > 0) {
                    const namespaceNameHtml = namespaceName + '.html';
                    file = portalScriptDocs + '#' + namespaceNameHtml;
                }
    }
        }

        // no portal script member selected, open main documentation
        if (!file || file.length === 0) {
            file = portalScriptDocs;
        }

        if (file) {
            open(`file:///${file}`, browser);
        }
    }
}
