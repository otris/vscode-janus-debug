import * as path from 'path';
import * as vscode from 'vscode';
// tslint:disable-next-line:no-var-requires
const open = require('open');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');



interface MemberAnchorMappings {
    [key: string]: string;
}

/**
 * List of all available member-anchor mappings
 * of portalScript classes.
 */
const memberAnchorMappings: MemberAnchorMappings = {
    // tslint:disable-next-line:no-var-requires
    context: require('../portalscript/documentation/classContext').classContext,
    // tslint:disable-next-line:no-var-requires
    docfile: require('../portalscript/documentation/classDocFile').classDocFile,
    // tslint:disable-next-line:no-var-requires
    dochit: require('../portalscript/documentation/classDocHit').classDocHit,
    // tslint:disable-next-line:no-var-requires
    fileresultset: require('../portalscript/documentation/classFileResultset').classFileResultset,
    // tslint:disable-next-line:no-var-requires
    hitresultset: require('../portalscript/documentation/classHitResultset').classHitResultset,
    // tslint:disable-next-line:no-var-requires
    systemuser: require('../portalscript/documentation/classSystemUser').classSystemUser,
    // tslint:disable-next-line:no-var-requires
    systemuseriterator: require('../portalscript/documentation/classSystemUserIterator').classSystemUserIterator,
    // tslint:disable-next-line:no-var-requires
    util: require('../portalscript/documentation/classUtil').classUtil
};



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
        const selectedWord = doc.getText(range).toLocaleLowerCase();
        let file = '';

        if (memberAnchorMappings.hasOwnProperty(selectedWord)) {
            const fileWithAnchor = memberAnchorMappings[selectedWord][0][1];
            const endOfFileNamePos = fileWithAnchor.indexOf('#');
            file = path.join(portalScriptDocs, fileWithAnchor.substr(0, endOfFileNamePos));
        } else {
            if (!browser) {
                vscode.window.showWarningMessage(`Jump to **${selectedWord}**: pecify a browser in **vscode-janus-debug.browser**`);
            }
            const results = [];
            for (const key of Object.keys(memberAnchorMappings)) {
                const classMapping = memberAnchorMappings[key];
                for (const member of classMapping) {
                    if (member.length === 3) {
                        const memberName = member[0];
                        const fileWithAnchor = member[1];
                        if (memberName.toLocaleLowerCase() === selectedWord) {
                            results.push(fileWithAnchor);
                        }
                    }
                }
            }
            if (results.length > 0) {
                if (results.length === 1) {
                    file = path.join(portalScriptDocs, results[0]);
                } else {
                    const question = `Found ${selectedWord} in several classes, select one class please!`;
                    const result = await vscode.window.showQuickPick(results, {placeHolder: question});
                    if (result) {
                        file = path.join(portalScriptDocs, result);
                    }
                }
            }
        }

        if (file) {
            open(`file:///${file}`, browser);
        }
    }
}
