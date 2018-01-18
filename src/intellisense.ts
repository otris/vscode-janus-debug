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
const SCRIPTEXTENSIONS_FILE = 'scriptExtensions.d.ts';




export function createFiletypesTSD(loginData: nodeDoc.ConnectionInformation): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {

        if (!vscode.workspace || !vscode.workspace.rootPath) {
            return reject('Workspace folder missing');
        }

        // get the content for fileTypes.d.ts
        let fileTypesTSD = '';
        try {
            fileTypesTSD = await commands.getFileTypesTSD(loginData);
        } catch (err) {
            if (err.code === 'ECONNREFUSED') {
                return reject(`Cannot load 'fileTypes.d.ts' because the server ${err.address} is not available`);
            } else {
                return reject(err.message);
            }
        }

        const projtypings = path.join(vscode.workspace.rootPath, 'typings');
        fs.ensureDirSync(projtypings);

        // create fileTypes.d.ts
        const filetypesPath = path.join(projtypings, FILETYPES_FILE);
        try {
            fs.writeFileSync(filetypesPath, fileTypesTSD);
        } catch (reason) {
            return reject(reason.message);
        }

        resolve();
    });
}

export function ensureJsconfigJson(): boolean {
    if (!vscode.workspace || !vscode.workspace.rootPath) {
        vscode.window.showErrorMessage('Workspace folder missing');
        return false;
    }

    // create empty jsconfig.json, if it does not exist
    const jsconfigPath = path.join(vscode.workspace.rootPath, 'jsconfig.json');
    let fileCreated = false;
    try {
        fs.readFileSync(jsconfigPath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            try {
                fs.writeFileSync(jsconfigPath, '');
                fileCreated = true;
            } catch (reason) {
                vscode.window.showErrorMessage('Write jsonfig.json failed: ' + reason);
                return false;
            }
        }
    }
    return fileCreated;
}


export function copyPortalScriptingTSD(): boolean {
    const extension = vscode.extensions.getExtension('otris-software.vscode-janus-debug');
    if (!extension || !vscode.workspace || !vscode.workspace.rootPath) {
        vscode.window.showErrorMessage('Extension or workspace folder missing');
        return false;
    }

    const extensionTSDFile = path.join(extension.extensionPath, 'portalscript', 'typings', PORTALSCRIPTING_FILE);
    const projecttypings = path.join(vscode.workspace.rootPath, 'typings');
    const projectTSDFile = path.join(projecttypings, PORTALSCRIPTING_FILE);
    fs.ensureDirSync(projecttypings);

    // copy dts file
    try {
        fs.readFileSync(extensionTSDFile);
        fs.copySync(extensionTSDFile, projectTSDFile);
    } catch (err) {
        vscode.window.showErrorMessage(err);
        return false;
    }

    return true;
}


export function copyScriptExtensionsTSD(): boolean {
    const extension = vscode.extensions.getExtension('otris-software.vscode-janus-debug');
    if (!extension || !vscode.workspace || !vscode.workspace.rootPath) {
        vscode.window.showErrorMessage('Extension or workspace folder missing');
        return false;
    }

    const extensionTSDFile = path.join(extension.extensionPath, 'portalscript', 'typings', SCRIPTEXTENSIONS_FILE);
    const projecttypings = path.join(vscode.workspace.rootPath, 'typings');
    const projectTSDFile = path.join(projecttypings, SCRIPTEXTENSIONS_FILE);
    fs.ensureDirSync(projecttypings);

    // copy dts file
    try {
        fs.readFileSync(extensionTSDFile);
        fs.copySync(extensionTSDFile, projectTSDFile);
    } catch (err) {
        vscode.window.showErrorMessage(err);
        return false;
    }

    return true;
}
