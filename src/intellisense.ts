import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as commands from './serverCommands';

// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

const FILETYPES_FILE = 'fileTypes.d.ts';
const PORTALSCRIPTING_FILE = 'portalScripting.d.ts';

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



export function createFiletypesTSD(loginData: nodeDoc.ConnectionInformation): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {

        if (!vscode.workspace || !vscode.workspace.rootPath) {
            vscode.window.showErrorMessage('Create a workspace root folder please');
            return resolve();
        }

        // get the content for fileTypes.d.ts
        let fileTypesTSD = '';
        try {
            fileTypesTSD = await commands.getFileTypesTSD(loginData);
        } catch (reason) {
            vscode.window.showErrorMessage(reason.message);
            return resolve();
        }

        // check typings folder
        const projtypings = path.join(vscode.workspace.rootPath, 'typings');
        try {
            fs.readdirSync(projtypings);
        } catch (err) {
            if (err.code === 'ENOENT') {
                fs.mkdir(projtypings);
            }
        }

        // create fileTypes.d.ts
        const filetypesPath = path.join(projtypings, FILETYPES_FILE);
        try {
            fs.writeFileSync(filetypesPath, fileTypesTSD, { flag: "wx" });
        } catch (reason) {
            vscode.window.showErrorMessage(reason.message);
            return resolve();
        }

        const jsconfigPath = path.join(vscode.workspace.rootPath, 'jsconfig.json');
        try {
            const jsconfigjson = fs.readFileSync(jsconfigPath);
        } catch (reason) {
            vscode.window.showWarningMessage('You will need a **jsconfig.json** (created by **Install PortalScripting IntelliSense**)');
        }

        vscode.window.showInformationMessage('Use **context.createFile("<Ctrl + Space>")** or add **/\\** @types{FileType} \\*/** to DocFile objects to get IntelliSense for file types');

        resolve();
    });
}



export function installIntellisense() {
    const extension = vscode.extensions.getExtension('otris-software.vscode-janus-debug');
    if (extension && vscode.workspace && vscode.workspace.rootPath) {

        // TODO: get from GitHub if possible
        const extensionTSDFile = path.join(extension.extensionPath, 'portalscript', 'typings', PORTALSCRIPTING_FILE);
        const projecttypings = path.join(vscode.workspace.rootPath, 'typings');
        const projectTSDFile = path.join(projecttypings, PORTALSCRIPTING_FILE);

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
            fs.readFileSync(extensionTSDFile);
            // overwrites existing on default
            fs.copySync(extensionTSDFile, projectTSDFile);
        } catch (err) {
            vscode.window.showErrorMessage(err);
            return;
        }

        // create empty jsconfig.json
        const ERR_FILE_EMPTY = 'File empty';
        const jsconfigPath = path.join(vscode.workspace.rootPath, 'jsconfig.json');
        try {
            const jsconfigjson = fs.readFileSync(jsconfigPath);
            if (jsconfigjson.length === 0) {
                // execute catch block
                throw new Error(ERR_FILE_EMPTY);
            }
        } catch (err) {
            if (err.code === 'ENOENT' || err.message === ERR_FILE_EMPTY) {
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
