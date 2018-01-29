import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as commands from './serverCommands';
import * as serverVersion from './serverVersion';

// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');
// tslint:disable-next-line:no-var-requires
const execSync = require('child_process').execSync;







export async function getAllTypings(loginData: nodeDoc.ConnectionInformation, force = false) {
    vscode.window.setStatusBarMessage('Installing IntelliSense ...');
    let message = "";
    let serverRunning = false;

    try {
        await createFiletypesTSD(loginData);
        message += ' fileTypes.d.ts';
        serverRunning = true;
    } catch (err) {
        //
    }

    if (force || serverRunning) {
        let version;
        if (loginData.documentsVersion && loginData.documentsVersion !== "") {
            version = serverVersion.getVersion(loginData.documentsVersion);
            if (serverVersion.isLatestVersion(version)) {
                // latest version is default
                version = "";
            }
        }

        if (copyPortalScriptingTSD(version)) {
            message += ' portalScripting.d.ts';
        }
    }


    if (copyScriptExtensionsTSD()) {
        message += ' scriptExtensions.d.ts';
    }
    if (ensureJsconfigJson()) {
        message += ' jsconfig.json';
    }

    if (message !== "") {
        vscode.window.setStatusBarMessage('Installed:' + message);
    }
}



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
        const filetypesPath = path.join(projtypings, "fileTypes.d.ts");
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








export function copyPortalScriptingTSD(version?: string): boolean {
    const extension = vscode.extensions.getExtension('otris-software.vscode-janus-debug');
    if (!extension || !vscode.workspace || !vscode.workspace.rootPath) {
        vscode.window.showErrorMessage('Extension or workspace folder missing');
        return false;
    }

    const outputPath = path.join(extension.extensionPath, 'portalscript', 'typings');
    const extensionTSDFile = serverVersion.ensurePortalScriptingTSD(extension.extensionPath, outputPath, version);
    const projecttypings = path.join(vscode.workspace.rootPath, 'typings');
    const projectTSDFile = path.join(projecttypings, 'portalScripting.d.ts');
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

    const extensionTSDFile = path.join(extension.extensionPath, 'portalscript', 'typings', "scriptExtensions.d.ts");
    const projecttypings = path.join(vscode.workspace.rootPath, 'typings');
    const projectTSDFile = path.join(projecttypings, "scriptExtensions.d.ts");
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
