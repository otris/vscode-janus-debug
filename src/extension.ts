'use strict';

import * as nodeDoc from 'node-documents-scripting';
import * as path from 'path';
import * as vscode from 'vscode';
import * as commands from './commands';
import { provideInitialConfigurations } from './config';
import * as login from './login';

export function activate(context: vscode.ExtensionContext): void {

    // only temporary to remove my hacks in settings.json
    const conf = vscode.workspace.getConfiguration('vscode-documents-scripting');
    conf.update('encrypted', undefined);
    conf.update('decrypted', undefined);

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.askForPassword', () => {
            return vscode.window.showInputBox({
                prompt: 'Please enter the password',
                password: true,
                ignoreFocusOut: true,
            });
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.provideInitialConfigurations', () => {
            return provideInitialConfigurations(vscode.workspace.rootPath);
        }));

    // login data
    // needed for all features
    const loginData: nodeDoc.LoginData = new nodeDoc.LoginData();
    context.subscriptions.push(loginData);
    // set launch.jsaon for saving login data
    if (vscode.workspace) {
        loginData.launchjson = path.join(vscode.workspace.rootPath, '.vscode', 'launch.json');
    }
    // set additional function for getting and saving login data
    loginData.getLoginData = login.createLoginData;

    // output channel for run script...
    const runScriptChannel: vscode.OutputChannel = vscode.window.createOutputChannel('run-script-channel');

    // register commands...
    // this commands can activate the extension
    // so they are actually available immediately

    // Save login data
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.saveConfiguration', (param) => {
            commands.saveLoginData(loginData, param);
        })
    );

    // Upload script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.uploadScript', (param) => {
            let _param;
            if (param) {
                _param = param._fsPath;
            }
            if (!_param && vscode.window.activeTextEditor) {
                _param = vscode.window.activeTextEditor.document.fileName;
            }
            commands.uploadScript(loginData, _param);
        })
    );

    // Upload all
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.uploadScriptsFromFolder', (param) => {
            let _param;
            if (param) {
                _param = param._fsPath;
            }
            commands.uploadAll(loginData, _param);
        })
    );

    // Download script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.downloadScript', (param) => {
            let _param;
            if (param) {
                _param = param._fsPath;
            }
            if (!_param && vscode.window.activeTextEditor) {
                _param = vscode.window.activeTextEditor.document.fileName;
            }
            commands.downloadScript(loginData, _param);
        })
    );

    // Download all
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.downloadScriptsToFolder', (param) => {
            let _param;
            if (param) {
                _param = param._fsPath;
            }
            commands.downloadAll(loginData, _param);
        })
    );

    // Run script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.runScript', (param) => {
            let _param;
            if (param) {
                _param = param._fsPath;
            }
            if (!_param && vscode.window.activeTextEditor) {
                _param = vscode.window.activeTextEditor.document.fileName;
            }
            commands.runScript(loginData, _param, runScriptChannel);
        })
    );

    // Upload and Run script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.uploadRunScript', (param) => {
            let _param;
            if (param) {
                _param = param._fsPath;
            }
            if (!_param && vscode.window.activeTextEditor) {
                _param = vscode.window.activeTextEditor.document.fileName;
            }
            commands.uploadRunScript(loginData, _param, runScriptChannel);
        })
    );

    // Compare script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.compareScript', (param) => {
            let _param;
            if (param) {
                _param = param._fsPath;
            }
            if (!_param && vscode.window.activeTextEditor) {
                _param = vscode.window.activeTextEditor.document.fileName;
            }
            commands.compareScript(loginData, _param);
        })
    );

    // Get scriptnames
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.getScriptNames', (param) => {
            commands.getScriptnames(loginData, param);
        })
    );

    // Get script parameters
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.getScriptParameters', (param) => {
            commands.getScriptParameters(loginData, param);
        })
    );

    // todo...
    // View documentation
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.viewDocumentation', (file) => {
            // file is not used, use active editor...
            commands.viewDocumentation();
        })
    );

    // add additional features...
    // this features can not activate the extension
    // but they are needed immediately

    // output channel for server log
    const myOutputChannel2: vscode.OutputChannel = vscode.window.createOutputChannel('documents-server-channel');
    myOutputChannel2.append('DOCUMENTSServer.log' + '\n');
    myOutputChannel2.show();

    // Upload script on save
    if (vscode.workspace) {
        let disposableOnSave: vscode.Disposable;
        disposableOnSave = vscode.workspace.onDidSaveTextDocument((textDocument) => {
            if ('.js' === path.extname(textDocument.fileName)) {
                commands.uploadScriptOnSave(loginData, textDocument.fileName);
            }
        });
        context.subscriptions.push(disposableOnSave);
    }

    vscode.window.setStatusBarMessage('vscode-janus-debug is active');
}

export function deactivate(): undefined {
    return;
}
