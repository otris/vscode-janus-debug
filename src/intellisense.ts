import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { window } from 'vscode';
import * as commands from './serverCommands';

// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

const FILETYPES_FILE = 'fileTypes.d.ts';
const PORTALSCRIPTING_FILE = 'portalScripting.d.ts';
const PORTALSCRIPTING_FILE_NEW = 'portalScriptingNew.d.ts';




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
                fs.mkdirSync(projtypings);
            }
        }

        // create fileTypes.d.ts
        const filetypesPath = path.join(projtypings, FILETYPES_FILE);
        try {
            fs.writeFileSync(filetypesPath, fileTypesTSD);
        } catch (reason) {
            vscode.window.showErrorMessage(reason.message);
            return resolve();
        }

        vscode.window.showInformationMessage('Get IntelliSense for file types by adding **/\\** @types{FileType} \\*/** to the variables');

        resolve();
    });
}

export function createJsconfigJson() {
    if (!vscode.workspace || !vscode.workspace.rootPath) {
        return;
    }

    // create empty jsconfig.json, if it does not exist
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
            const jsconfigContent = '';
            try {
                fs.writeFileSync(jsconfigPath, jsconfigContent);
            } catch (reason) {
                console.log('Write jsonfig.json failed: ' + reason);
            }
        }
    }
}


export async function copyPortalScriptingTSD() {
    const extension = vscode.extensions.getExtension('otris-software.vscode-janus-debug');
    if (!extension || !vscode.workspace || !vscode.workspace.rootPath) {
        return;
    }

    let extensionTSDFile = path.join(extension.extensionPath, 'portalscript', 'typings', PORTALSCRIPTING_FILE);
    const extensionTSDFileNew = path.join(extension.extensionPath, 'portalscript', 'typings', PORTALSCRIPTING_FILE_NEW);
    const projecttypings = path.join(vscode.workspace.rootPath, 'typings');
    const projectTSDFile = path.join(projecttypings, PORTALSCRIPTING_FILE);

    extensionTSDFile = extensionTSDFileNew;

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
        fs.copySync(extensionTSDFile, projectTSDFile);
        vscode.window.showInformationMessage(`Installed portalScripting.d.ts without 'Documents' namespace`);
    } catch (err) {
        vscode.window.showErrorMessage(err);
        return;
    }
}
