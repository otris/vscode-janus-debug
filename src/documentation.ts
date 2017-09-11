import * as path from 'path';
import * as vscode from 'vscode';
// tslint:disable-next-line:no-var-requires
const open = require('open');
// tslint:disable-next-line:no-var-requires
const urlExists = require('url-exists');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

export function viewDocumentation() {
    const portalScriptDocs = 'http://doku.otris.de/api/portalscript/';
    urlExists(portalScriptDocs, function(err: any, exists: any) {
        if (!exists) {
            vscode.window.showInformationMessage('Documentation is not available!');
        } else {

            // current editor
            const editor = vscode.window.activeTextEditor;
            if (!editor || !vscode.workspace.rootPath) {
                return;
            }

            // skip import lines
            let cnt = 0;
            let currLine: string = editor.document.lineAt(cnt).text;
            while (currLine.startsWith('import')) {
                cnt++;
                currLine = editor.document.lineAt(cnt).text;
            }

            // first line after import should look like "export class Context {"
            const _words = currLine.split(' ');
            if (_words.length !== 4 || _words[0] !== 'export' || _words[1] !== 'class' || _words[3] !== '{') {
                return;
            }


            const className = _words[2];

            // the Position object gives you the line and character where the cursor is
            const pos = editor.selection.active;
            if (!pos) {
                return;
            }
            const line = editor.document.lineAt(pos.line).text;
            const words = line.split(' ');
            let member = '';

            if (words[0].trim() === 'public') {
                member = words[1].trim();
                const brace = member.indexOf('(');
                if (brace >= 0) {
                    member = member.substr(0, brace);
                }
            }

            const jsFileName = 'class' + className + '.js';
            const htmlFileName = 'class' + className + '.html';
            const jsFilePath = path.join(vscode.workspace.rootPath, 'mapping', jsFileName);

            fs.readFile(jsFilePath, (error: any, data: any) => {

                const browser = 'firefox';
                if (err || !data) {
                    const page = portalScriptDocs + htmlFileName;
                    open(page, browser);

                } else {
                    // \r was missing in the generated files
                    const lines = data.toString().split("\n");

                    let i;
                    for (i = 2; i < lines.length - 1; i++) {
                        const entries = lines[i].split(',');
                        if (entries.length < 2) {
                            continue;
                        }
                        // entries[0] looks like: "     [ "clientId""
                        const entry = entries[0].replace('[', '').replace(/"/g, '').trim();

                        if (entry === member) {
                            // entries[1] looks like: "  "classContext.html#a6d644a063ace489a2893165bb3856579""
                            const link = entries[1].replace(/"/g, '').trim();
                            const page = portalScriptDocs + link;
                            open(page, browser);
                            break;
                        }
                    }
                    if (i === lines.length - 1) {
                        const page = portalScriptDocs + htmlFileName;
                        open(page, browser);
                    }
                }
            });
        }
    });
}
