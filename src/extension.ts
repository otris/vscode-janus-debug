'use strict';

import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import * as path from 'path';
import * as vscode from 'vscode';
import * as commands from './commands';
import { provideInitialConfigurations } from './config';
import * as login from './login';
import { ServerConsole } from './serverConsole';

const DOCUMENTS_SETTINGS = 'documents-scripting-settings.json';

let launchJsonWatcher: vscode.FileSystemWatcher;
let serverConsole: ServerConsole;


/**
 * Connect or re-connect server console.
 *
 * Get launch.json configuration and see if we can connect to a remote
 * server already. Watch for changes in launch.json file.
 */
function reconnectServerConsole(console: ServerConsole): void {

    let hostname: string | undefined;
    let port: number | undefined;

    try {
        console.disconnect();

        const launchJson = vscode.workspace.getConfiguration('launch');
        const configs: any[] = launchJson.get('configurations', []);

        for (const config of configs) {
            if (config.hasOwnProperty('type') && config.type === 'janus') {
                hostname = config.host;
                port = config.applicationPort;
                break;
            }
        }
    } catch (error) {
        // Swallow
    }

    if (hostname && port) {
        console.connect({ hostname, port });
    }
}

function disconnectServerConsole(console: ServerConsole): void {
    console.outputChannel.appendLine(`Disconnected from server`);
}

export function activate(context: vscode.ExtensionContext): void {

    // only temporary to remove my hacks in settings.json
    const conf = vscode.workspace.getConfiguration('vscode-documents-scripting');
    if (conf) {
        conf.update('encrypted', undefined);
        conf.update('decrypted', undefined);
    }

    const outputChannel = vscode.window.createOutputChannel('Server Console');
    outputChannel.appendLine('Extension activated');
    outputChannel.show();
    serverConsole = new ServerConsole(outputChannel);
    reconnectServerConsole(serverConsole);

    launchJsonWatcher = vscode.workspace.createFileSystemWatcher('**/launch.json',
        false, false, false);
    launchJsonWatcher.onDidCreate(() => {
        outputChannel.appendLine('launch.json created; trying to connect...');
        reconnectServerConsole(serverConsole);
    });
    launchJsonWatcher.onDidChange(() => {
        outputChannel.appendLine('launch.json changed; trying to (re)connect...');
        reconnectServerConsole(serverConsole);
    });
    launchJsonWatcher.onDidDelete(() => disconnectServerConsole(serverConsole));

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


    // Some features only available in workspace
    if (vscode.workspace) {

        const activationfile = path.join(vscode.workspace.rootPath, DOCUMENTS_SETTINGS);
        try {
            fs.readFileSync(activationfile);
        } catch (err) {
            if (err.code === 'ENOENT') {
                fs.writeFileSync(activationfile, '');
            }
        }


        // Upload script on save
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
    launchJsonWatcher.dispose();
    serverConsole.hide();
    serverConsole.dispose();
    return;
}
