'use strict';

import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import { LogConfiguration, Logger } from 'node-file-log';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as commands from './commands';
import { provideInitialConfigurations } from './config';
import { extend } from './helpers';
import { VSCodeExtensionIPC } from './ipcServer';
import * as login from './login';
import { ServerConsole } from './serverConsole';
import stripJsonComments = require('strip-json-comments');
import { getVersion } from './version';

const DOCUMENTS_SETTINGS = 'documents-scripting-settings.json';

let ipcServer: VSCodeExtensionIPC;
let launchJsonWatcher: vscode.FileSystemWatcher;
let serverConsole: ServerConsole;
let runScriptChannel: vscode.OutputChannel;
let disposableOnSave: vscode.Disposable;

function getExtensionLogPath(): LogConfiguration | undefined {
    const workspaceRoot = vscode.workspace.rootPath;
    const config = vscode.workspace.getConfiguration('vscode-janus-debug');
    const log: any = config.get("log");
    if (log && log.fileName && workspaceRoot) {
        return {
            fileName: log.fileName.replace(/[$]{workspaceRoot}/, workspaceRoot),
            logLevel: log.logLevel ? log.logLevel : "Debug"
        };
    }
}

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

        public inspect<T>(section: string): { key: string; defaultValue?: T; globalValue?: T; workspaceValue?: T } | undefined {
            throw new Error('Not implemented');
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
    let timeout: number | undefined;

    try {
        await console.disconnect();

        const launchJson = await getLaunchConfigFromDisk();  // vscode.workspace.getConfiguration('launch');
        const configs: any[] = launchJson.get('configurations', []);

        for (const config of configs) {
            if (config.hasOwnProperty('type') && config.type === 'janus') {
                hostname = config.host;
                port = config.applicationPort;
                timeout = config.timeout;
                break;
            }
        }
    } catch (error) {
        // Swallow
    }

    if (hostname && port) {
        console.connect({ hostname, port, timeout });
    }
}

function disconnectServerConsole(console: ServerConsole): void {
    console.disconnect().then(() => {
        console.outputChannel.appendLine(`Disconnected from server`);
    });
}

export function activate(context: vscode.ExtensionContext): void {

    // set up file logging
    const extensionLoggerConf = getExtensionLogPath();
    if (extensionLoggerConf) {
        Logger.config = extensionLoggerConf;
    }

    const isFolderOpen: boolean = vscode.workspace !== undefined;
    let launchJson = '';

    // login data
    const loginData: nodeDoc.LoginData = new nodeDoc.LoginData();
    context.subscriptions.push(loginData);

    // set additional properties for login data
    loginData.getLoginData = login.createLoginData;
    loginData.askForPasswordStr = '${command:extension.vscode-janus-debug.askForPassword}';
    if (vscode.workspace && vscode.workspace.rootPath) {
        launchJson = path.join(vscode.workspace.rootPath, '.vscode', 'launch.json');
        loginData.loadConfigFile(launchJson);
    }

    const outputChannel = vscode.window.createOutputChannel('Server Console');

    if (isFolderOpen) {
        outputChannel.appendLine('Extension activated');
        getVersion().then(ver => {
            outputChannel.appendLine("Version: " + ver.toString());

        }).catch(err => {
            outputChannel.appendLine('getVersion failed' + err);

        }).then(() => {
            outputChannel.show();
            serverConsole = new ServerConsole(outputChannel);

            const extensionSettings = vscode.workspace.getConfiguration('vscode-janus-debug');
            const autoConnectEnabled = extensionSettings.get('serverConsole.autoConnect', true);
            if (autoConnectEnabled) {
                reconnectServerConsole(serverConsole);
            }

            launchJsonWatcher = vscode.workspace.createFileSystemWatcher('**/launch.json', false, false, false);
            launchJsonWatcher.onDidCreate((file) => {
                if (autoConnectEnabled) {
                    outputChannel.appendLine('launch.json created; trying to connect...');
                    reconnectServerConsole(serverConsole);
                }
                if (file.fsPath === launchJson) {
                    loginData.loadConfigFile(launchJson);
                }
            });

            launchJsonWatcher.onDidChange((file) => {
                if (autoConnectEnabled) {
                    outputChannel.appendLine('launch.json changed; trying to (re)connect...');
                    reconnectServerConsole(serverConsole);
                }
                if (file.fsPath === launchJson) {
                    loginData.loadConfigFile(launchJson);
                }
            });

            launchJsonWatcher.onDidDelete((file) => {
                if (autoConnectEnabled) {
                    disconnectServerConsole(serverConsole);
                }
                if (file.fsPath === launchJson) {
                    loginData.resetLoginData();
                }
            });
        });
    }

    ipcServer = new VSCodeExtensionIPC();

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




    // output channel for run script...
    runScriptChannel = vscode.window.createOutputChannel('Script Console');

    // register commands...
    // this commands can activate the extension
    // so they are actually available immediately

    // Save login data
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.saveConfiguration', (param) => {
            commands.saveLoginData(loginData, param);
        })
    );

    // Upload script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadScript', (param) => {
            let fsPath;
            if (param) {
                fsPath = param._fsPath;
            }
            if (!fsPath && vscode.window.activeTextEditor) {
                fsPath = vscode.window.activeTextEditor.document.fileName;
            }
            commands.uploadScript(loginData, fsPath);
        })
    );

    // uploadJSFromTS
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadJSFromTS', async (param) => {
            if (vscode.window.activeTextEditor) {
                const doc = vscode.window.activeTextEditor.document;
                await commands.uploadJSFromTS(loginData, doc);
            }
        })
    );

    // Upload all
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadScriptsFromFolder', (param) => {
            let fsPath;
            if (param) {
                fsPath = param._fsPath;
            }
            commands.uploadAll(loginData, fsPath);
        })
    );

    // Download script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.downloadScript', (param) => {
            let fsPath;
            if (param) {
                fsPath = param._fsPath;
            }
            commands.downloadScript(loginData, fsPath);
        })
    );

    // Download all
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.downloadScriptsToFolder', (param) => {
            let fsPath;
            if (param) {
                fsPath = param._fsPath;
            }
            commands.downloadAll(loginData, fsPath);
        })
    );

    // Run script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.runScript', (param) => {
            let fsPath;
            if (param) {
                fsPath = param._fsPath;
            }
            if (!fsPath && vscode.window.activeTextEditor) {
                fsPath = vscode.window.activeTextEditor.document.fileName;
            }
            commands.runScript(loginData, fsPath, runScriptChannel);
        })
    );

    // Upload and Run script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadRunScript', (param) => {
            let fsPath;
            if (param) {
                fsPath = param._fsPath;
            }
            if (!fsPath && vscode.window.activeTextEditor) {
                fsPath = vscode.window.activeTextEditor.document.fileName;
            }
            commands.uploadRunScript(loginData, fsPath, runScriptChannel);
        })
    );

    // Compare script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.compareScript', (param) => {
            let fsPath;
            if (param) {
                fsPath = param._fsPath;
            }
            if (!fsPath && vscode.window.activeTextEditor) {
                fsPath = vscode.window.activeTextEditor.document.fileName;
            }
            commands.compareScript(loginData, fsPath);
        })
    );

    // Get script names
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.getScriptNames', (param) => {
            commands.getScriptnames(loginData, param);
        })
    );

    // Get script parameters
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.getScriptParameters', (param) => {
            commands.getScriptParameters(loginData, param);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.installIntellisenseFiles', () => {
            commands.installIntellisenseFiles();
        })
    );

    // todo...
    // View documentation
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.viewDocumentation', (file) => {
            // file is not used, use active editor...
            commands.viewDocumentation();
        })
    );

    // connect the sever console manually
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus.debug.connectServerConsole', (param) => {
            reconnectServerConsole(serverConsole);
        })
    );

    // disconnect the server console manually
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus.debug.disconnectServerConsole', (param) => {
            disconnectServerConsole(serverConsole);
        })
    );


    // Some features only available in workspace
    if (isFolderOpen && vscode.workspace.rootPath) {
        const activationFile = path.join(vscode.workspace.rootPath, DOCUMENTS_SETTINGS);
        try {
            fs.readFileSync(activationFile);
        } catch (err) {
            if (err.code === 'ENOENT') {
                fs.writeFileSync(activationFile, '');
            }
        }

        // Upload script on save
        const extensionSettings = vscode.workspace.getConfiguration('vscode-janus-debug');
        const autoUploadEnabled = extensionSettings.get('uploadOnSaveGlobal', true);
        if (autoUploadEnabled) {
            disposableOnSave = vscode.workspace.onDidSaveTextDocument((textDocument) => {
                if ('.js' === path.extname(textDocument.fileName)) {
                    commands.uploadScriptOnSave(loginData, textDocument.fileName).then((value) => {
                        if (!value && disposableOnSave) {
                            disposableOnSave.dispose();
                        }
                    });
                }
            });
            context.subscriptions.push(disposableOnSave);
        }
    }

    vscode.window.setStatusBarMessage('vscode-janus-debug is active');
}

export function deactivate(): undefined {
    ipcServer.dispose();
    launchJsonWatcher.dispose();
    serverConsole.hide();
    serverConsole.dispose();
    runScriptChannel.hide();
    runScriptChannel.dispose();
    return;
}
