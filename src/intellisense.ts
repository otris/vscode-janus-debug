import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as commands from './serverCommands';
import * as serverVersion from './serverVersion';

// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');
// tslint:disable-next-line:no-var-requires
const simpleGit = require("simple-git");
// tslint:disable-next-line:no-var-requires
const execSync = require('child_process').execSync;

const TYPINGS_FOLDER_DEFAULT = 'typings';

/**
 * Clones the given repository to the typings folder
 * Note: Requires git to be installed.
 * @todo Maybe we should switch the git module to an alternative which doesn't require git to be installed local
 * @param typingsRepositoryUrl The URL of the repository to clone
 */
function cloneTypingsFolder(typingsRepositoryUrl: string) {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length < 1) {
        throw new Error("You need to open a workspace first");
    }

    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const typingsFolder = path.join(workspaceFolder, TYPINGS_FOLDER_DEFAULT);
    if (!fs.existsSync(typingsFolder)) {
        fs.mkdirSync(typingsFolder);
    }

    // if the repository was cloned before, we need to remove it first
    const typingsRepoFolder = path.join(typingsFolder, "typings-repository");
    if (fs.existsSync(typingsRepoFolder)) {
        fs.removeSync(typingsRepoFolder);
    }

    const git = simpleGit(typingsFolder);
    return new Promise((resolve, reject) => {
        git.clone(typingsRepositoryUrl, "typings-repository", (err?: Error) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

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

    const extensionSettings = vscode.workspace.getConfiguration("vscode-janus-debug");

    // clone a repository with typings if the user has configured one
    const typingsRepositoryUrl = extensionSettings.has("typingsRepository.url") ? extensionSettings.get("typingsRepository.url") as string : null;
    if (typingsRepositoryUrl) {
        await cloneTypingsFolder(typingsRepositoryUrl);
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

        const installPortalScripting = extensionSettings.has("typingsRepository.installPortalScripting") ? extensionSettings.get("typingsRepository.installPortalScripting", true) : true;
        if (installPortalScripting && copyPortalScriptingTSD(version)) {
            message += ' portalScripting.d.ts';
        }
        if (copyScriptExtensionsTSD()) {
            message += ' scriptExtensions.d.ts';
        }
        if (ensureJsconfigJson()) {
            message += ' jsconfig.json';
        }
    }

    if (message !== "") {
        vscode.window.setStatusBarMessage('Installed:' + message);
    } else if (!serverRunning) {
        vscode.window.setStatusBarMessage('IntelliSense not updated because server is not running');
    } else {
        vscode.window.setStatusBarMessage('IntelliSense not updated');
    }
}



export function createFiletypesTSD(loginData: nodeDoc.ConnectionInformation): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {

        if (!vscode.workspace || !vscode.workspace.rootPath) {
            return reject('Workspace folder missing');
        }
        const typingsFolder = TYPINGS_FOLDER_DEFAULT;

        // get the content for fileTypes.d.ts
        let fileTypesTSD = '';
        try {
            fileTypesTSD = await commands.getFileTypesTSD(loginData);
        } catch (err) {
            return reject(err.message ? err.message : err);
        }

        const projtypings = path.join(vscode.workspace.rootPath, typingsFolder);
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
    const tsconfigPath = path.join(vscode.workspace.rootPath, 'tsconfig.json');

    let fileCreated = false;
    if (!fs.existsSync(jsconfigPath) && !fs.existsSync(tsconfigPath)) {
        try {
            fs.writeFileSync(jsconfigPath, '');
            fileCreated = true;
        } catch (reason) {
            vscode.window.showErrorMessage('Write jsonfig.json failed: ' + reason);
            return false;
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
    const typingsFolder = TYPINGS_FOLDER_DEFAULT;

    const outputPath = path.join(extension.extensionPath, 'portalscript', typingsFolder);
    const extensionTSDFile = serverVersion.ensurePortalScriptingTSD(extension.extensionPath, outputPath, version);
    const projecttypings = path.join(vscode.workspace.rootPath, typingsFolder);
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
    const typingsFolder = TYPINGS_FOLDER_DEFAULT;

    const extensionTSDFile = path.join(extension.extensionPath, 'portalscript', typingsFolder, "scriptExtensions.d.ts");
    const projecttypings = path.join(vscode.workspace.rootPath, typingsFolder);
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
