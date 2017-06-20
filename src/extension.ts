'use strict';

import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import * as path from 'path';
import * as vscode from 'vscode';
import * as commands from './commands';
import { provideInitialConfigurations } from './config';
import { extend } from './helpers';
import * as login from './login';
import { ServerConsole } from './serverConsole';
import stripJsonComments = require('strip-json-comments');

const DOCUMENTS_SETTINGS = 'documents-scripting-settings.json';

let launchJsonWatcher: vscode.FileSystemWatcher;
let serverConsole: ServerConsole;

/**
 * Reads and returns the launch.json file's configurations.
 *
 * This function does essentially the same as
 *
 *     let configs = vscode.workspace.getConfiguration('launch');
 *
 * but is guaranteed to read the configuration from disk the moment it is called.
 * vscode.workspace.getConfiguration function seems instead to return the
 * currently loaded or active configuration which is not necessarily the most
 * current one.
 */
async function getLaunchConfigFromDisk(): Promise<vscode.WorkspaceConfiguration> {

    class Config implements vscode.WorkspaceConfiguration {

        [key: string]: any

        public get<T>(section: string, defaultValue?: T): T {
            // tslint:disable-next-line:no-string-literal
            return this.has(section) ? this[section] : defaultValue;
        }

        public has(section: string): boolean {
            return this.hasOwnProperty(section);
        }

        public async update(section: string, value: any): Promise<void> {
            // Not implemented... and makes no sense to implement
            return Promise.reject(new Error('Not implemented'));
        }
    }

    return new Promise<vscode.WorkspaceConfiguration>((resolve, reject) => {
        if (!vscode.workspace.rootPath) {
            // No folder open; resolve with an empty configuration
            return resolve(new Config());
        }

        const filePath = path.resolve(vscode.workspace.rootPath, '.vscode/launch.json');
        fs.readFile(filePath, { encoding: 'utf-8', flag: 'r' }, (err, data) => {
            if (err) {
                // Silently ignore error and resolve with an empty configuration
                return resolve(new Config());
            }

            const obj = JSON.parse(stripJsonComments(data));
            const config = extend(new Config(), obj);
            resolve(config);
        });
    });
}

/**
 * Connect or re-connect server console.
 *
 * Get launch.json configuration and see if we can connect to a remote
 * server already. Watch for changes in launch.json file.
 */
async function reconnectServerConsole(console: ServerConsole): Promise<void> {

    let hostname: string | undefined;
    let port: number | undefined;

    try {
        await console.disconnect();

        const launchJson = await getLaunchConfigFromDisk();  // vscode.workspace.getConfiguration('launch');
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

    const extensionSettings = vscode.workspace.getConfiguration('vscode-janus-debug');
    const autoConnectEnabled = extensionSettings.get('serverConsole.autoConnect', true);
    if (autoConnectEnabled) {
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
    }

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
