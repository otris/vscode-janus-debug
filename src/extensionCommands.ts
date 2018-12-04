/**
 * The module 'vscode' should be removed from 'serverCommands.ts' in order to enable
 * mocha tests. But moving everythin to 'extension.ts' does not make sense, because
 * this file is already very full.
 * TODO: So all extension commands will be moved here.
 */

import * as nodeDoc from 'node-documents-scripting';
import * as vscode from 'vscode';
import * as interactive from './interactive';
import * as serverCommands from './serverCommands';

export async function exportXML(loginData: nodeDoc.ConnectionInformation) {
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders[0]) {
        vscode.window.showErrorMessage('Export XML failed: workspace folder required');
        return;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

    try {
        // first ask for the class (DlcFileType or PortalScript)
        const exportClass = await interactive.getXMLExportClass();

        // then get the names list
        let names;
        if (exportClass === "DlcFileType") {
            names = await serverCommands.getServerFileTypeNames(loginData);
        } else if (exportClass === "PortalScript") {
            names = await serverCommands.getServerScriptNames(loginData);
        } else {
            // probably the user simply changed their mind
            return;
        }

        // show the user the names list and ask for special name or all
        const exp = await interactive.createXMLExportFilter(exportClass, names);


        if (exp instanceof nodeDoc.xmlExport) {
            // all portal scripts / file types in one file
            await serverCommands.exportXML(loginData, exp, workspaceFolder);
        } else if (exp) {
            // seperate files for every portal script / file type
            // the call is the same for one ore all portal scripts / file types
            await serverCommands.exportXMLSeperateFiles(loginData, exp, workspaceFolder);
        }
    } catch (err) {
        vscode.window.showErrorMessage(err);
    }
}
