import * as path from 'path';
import * as vscode from 'vscode';
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

function getJsconfigJsonString() {
    // "compilerOptions": {
    //    "noLib": true
    //  }
    const compilerOptions = {
        noLib: true
    };

    const compilerOptionsJ = JSON.stringify(compilerOptions, null, '\t').split('\n').map(line => '\t' + line).join('\n').trim();
    const jsconfigJson = [
        '{',
        '\t"compilerOptions": ' + compilerOptionsJ,
        '}',
    ].join('\n');

    return jsconfigJson;
}


export function installIntellisenseFiles() {
    const extension = vscode.extensions.getExtension('otris-software.vscode-janus-debug');
    if (extension && vscode.workspace && vscode.workspace.rootPath) {
        const dtsfile = path.join(extension.extensionPath, 'portalscript', 'typings', 'portalScripting.d.ts');
        const projecttypings = path.join(vscode.workspace.rootPath, 'typings');

        // check typings folder
        try {
            fs.readdirSync(projecttypings);
        } catch (err) {
            if (err.code === 'ENOENT') {
                fs.mkdir(projecttypings);
            }
        }

        // check and copy dts file
        try {
            fs.readFileSync(dtsfile);
            const dstfile = path.join(projecttypings, 'portalScripting.d.ts');
            // overwrites existing on default
            fs.copySync(dtsfile, dstfile);
        } catch (err) {
            vscode.window.showErrorMessage(err);
        }

        // create empty jsconfig.json
        const jsconfigPath = path.join(vscode.workspace.rootPath, 'jsconfig.json');
        try {
            fs.readFileSync(jsconfigPath);
        } catch (err) {
            if (err.code === 'ENOENT') {
                const jsconfigContent = getJsconfigJsonString();
                try {
                    fs.writeFileSync(jsconfigPath, jsconfigContent);
                } catch (reason) {
                    console.log('Write jsonfig.json failed: ' + reason);
                }
            }
        }
    }
}
