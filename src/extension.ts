'use strict';

import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import { LogConfiguration, Logger } from 'node-file-log';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { provideInitialConfigurations } from './config';
import * as documentation from './documentation';
import { extend } from './helpers';
import * as helpers from './helpers';
import * as intellisense from './intellisense';
import { VSCodeExtensionIPC } from './ipcServer';
import * as login from './login';
import * as serverCommands from './serverCommands';
import { ServerConsole } from './serverConsole';
import { getServerVersion } from './serverVersion';
import stripJsonComments = require('strip-json-comments');
import * as version from './version';


let ipcServer: VSCodeExtensionIPC;
let launchJsonWatcher: vscode.FileSystemWatcher;
let serverConsole: ServerConsole;
let scriptChannel: vscode.OutputChannel;
let disposableOnSave: vscode.Disposable;
/**
 * Flag in settings.json (vscode-janus-debug.serverConsole.autoConnect)
 * Note: should be considered in a settings.json watcher.
 */
let autoConnectServerConsole: boolean;



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


/**
 * The flag vscode-janus-debug.serverConsole.autoConnect is read
 * once on startup.
 */
function readAutoConnectServerConsole() {
    const extensionSettings = vscode.workspace.getConfiguration('vscode-janus-debug');
    autoConnectServerConsole = extensionSettings.get('serverConsole.autoConnect', true);
}

function printVersion(outputChannel: vscode.OutputChannel) {
    if (vscode.workspace !== undefined) {
        outputChannel.appendLine('Extension activated');
        try {
            outputChannel.appendLine("Version: " + version.getVersion().toString(true));
        } catch (err) {
            outputChannel.appendLine('getVersion() failed: ' + err.message);
        } finally {
            outputChannel.show();
        }
    }
}

function initServerConsole(outputChannel: vscode.OutputChannel) {
    serverConsole = new ServerConsole(outputChannel);
    if (autoConnectServerConsole) {
        reconnectServerConsole(serverConsole);
    }
}

function initLaunchJsonWatcher(outputChannel: vscode.OutputChannel, loginData: nodeDoc.ConnectionInformation) {
    launchJsonWatcher = vscode.workspace.createFileSystemWatcher('**/launch.json', false, false, false);

    launchJsonWatcher.onDidCreate((file) => {
        if (autoConnectServerConsole && serverConsole) {
            outputChannel.appendLine('launch.json created; trying to connect...');
            reconnectServerConsole(serverConsole);
        }
        const fspath = file ? file.fsPath : '';
        login.loadLoginInformationOnCreate(loginData, fspath);
        serverCommands.setDecryptionVersionChecked(false);
    });

    launchJsonWatcher.onDidChange((file) => {
        if (autoConnectServerConsole && serverConsole) {
            outputChannel.appendLine('launch.json changed; trying to (re)connect...');
            reconnectServerConsole(serverConsole);
        }
        if (file) {
            login.loadLoginInformation(loginData, file.fsPath);
        }
        serverCommands.setDecryptionVersionChecked(false);
    });

    launchJsonWatcher.onDidDelete((file) => {
        if (autoConnectServerConsole && serverConsole) {
            disconnectServerConsole(serverConsole);
        }
        loginData.resetLoginData();
    });
}

class JanusDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    /**
     * Massage a debug configuration just before a debug session is being launched,
     * e.g. add all missing attributes to the debug configuration.
     */
    public resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined,
                                     config: vscode.DebugConfiguration,
                                     token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {

        // if launch.json is missing or empty allow quick access to
        // debugging by providing this config
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'javascript') {
                config.type = 'janus';
                config.name = 'Launch';
                config.request = 'launch';
                config.script = '${file}';
                config.stopOnEntry = true;
            }
        }

        if (!config.script) {
            return vscode.window.showInformationMessage("Cannot find a script to debug").then(_ => {
                return undefined;   // Abort launch
            });
        }

        return config;
    }

    /**
     * Returns initial debug configurations.
     */
    public provideDebugConfigurations?(folder: vscode.WorkspaceFolder | undefined,
                                       token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration[]> {
        return provideInitialConfigurations(vscode.workspace.rootPath);
    }
}

export function activate(context: vscode.ExtensionContext): void {

    const isFolderOpen: boolean = vscode.workspace !== undefined;

    // set extension path
    // get location fo the extensions source folder
    const thisExtension: vscode.Extension<any> | undefined = vscode.extensions.getExtension("otris-software.vscode-janus-debug");
    if (thisExtension !== undefined) {
        version.setExtensionPath(thisExtension.extensionPath);
    }

    // set up file logging
    const extensionLoggerConf = getExtensionLogPath();
    if (extensionLoggerConf) {
        Logger.config = extensionLoggerConf;
    }

    // Get login data
    const loginData: nodeDoc.ConnectionInformation = new nodeDoc.ConnectionInformation();
    context.subscriptions.push(loginData);
    if (vscode.workspace && vscode.workspace.rootPath) {
        login.loadLoginInformation(loginData, path.join(vscode.workspace.rootPath, '.vscode', 'launch.json'));
    }

    // Create output channels
    // output channel for server console not global because serverConsole is global
    const serverChannel = vscode.window.createOutputChannel('Server Console');
    scriptChannel = vscode.window.createOutputChannel('Script Console');

    // Initialize server console and launch.json watcher.
    // Print version before server console is initialized.
    readAutoConnectServerConsole();
    printVersion(serverChannel);
    initServerConsole(serverChannel);
    initLaunchJsonWatcher(serverChannel, loginData);

    ipcServer = new VSCodeExtensionIPC();

    // Register configuration provider
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('janus',
        new JanusDebugConfigurationProvider()));

    // Register commands

    // this command is used for the default password entry in launch.json
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.askForPassword', () => {
            return vscode.window.showInputBox({
                prompt: 'Please enter the password',
                password: true,
                ignoreFocusOut: true,
            });
        }));

    // Upload script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadScript', async (param) => {

            // show warning if server is too old for using encrypted scripts
            try {
                await serverCommands.checkDecryptionVersion(loginData);
            } catch (err) {
                return;
            }

            let fsPath;
            if (param) {
                fsPath = param._fsPath;
            }
            if (!fsPath && vscode.window.activeTextEditor) {
                fsPath = vscode.window.activeTextEditor.document.fileName;
            }
            try {
                await serverCommands.uploadScript(loginData, fsPath);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // uploadJSFromTS
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadJSFromTS', async (param) => {

            // show warning if server is too old
            try {
                await serverCommands.checkDecryptionVersion(loginData);
            } catch (err) {
                return;
            }

            if (vscode.window.activeTextEditor) {
                const doc = vscode.window.activeTextEditor.document;
                try {
                    await serverCommands.uploadJSFromTS(loginData, doc);
                } catch (err) {
                    //
                }
                helpers.showWarning(loginData);
            }
        })
    );

    // Upload all
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadScriptsFromFolder', async (param) => {

            // show warning if server is too old
            try {
                await serverCommands.checkDecryptionVersion(loginData);
            } catch (err) {
                return;
            }

            let fsPath;
            if (param && (typeof param._fsPath === 'string')) {
                fsPath = param._fsPath;
            }
            try {
                await serverCommands.uploadAll(loginData, fsPath);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Download script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.downloadScript', async (param) => {
            let fsPath: string | undefined;
            if (param && (typeof param._fsPath === 'string')) {
                fsPath = param._fsPath;
            }
            try {
                await serverCommands.downloadScript(loginData, fsPath);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Download all scripts from server
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.downloadAllScripts', async (param) => {
            let fsPath: string | undefined;
            if (param && (typeof param._fsPath === 'string')) {
                fsPath = param._fsPath;
            }
            try {
                await serverCommands.downloadAllSelected(loginData, fsPath);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Download all scripts that are inside the folder
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.downloadScriptsInsideFolder', async (param) => {
            let fsPath: string | undefined;
            if (param && (typeof param._fsPath === 'string')) {
                fsPath = param._fsPath;
            }
            try {
                await serverCommands.downloadScriptsInsideFolder(loginData, fsPath);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Run script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.runScript', async (param) => {
            let fsPath: string | undefined;
            if (param && (typeof param._fsPath === 'string')) {
                fsPath = param._fsPath;
            }
            if (!fsPath && vscode.window.activeTextEditor) {
                fsPath = vscode.window.activeTextEditor.document.fileName;
            }
            try {
                await serverCommands.runScript(loginData, fsPath, scriptChannel);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Upload and Run script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadRunScript', async (param) => {

            // show warning if server is too old
            try {
                await serverCommands.checkDecryptionVersion(loginData);
            } catch (err) {
                return;
            }

            let fsPath: string | undefined;
            if (param && (typeof param._fsPath === 'string')) {
                fsPath = param._fsPath;
            }
            if (!fsPath && vscode.window.activeTextEditor) {
                fsPath = vscode.window.activeTextEditor.document.fileName;
            }
            try {
                await serverCommands.uploadRunScript(loginData, fsPath, scriptChannel);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Compare script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.compareScript', async (param) => {
            let fsPath;
            if (param) {
                fsPath = param._fsPath;
            }
            if (!fsPath && vscode.window.activeTextEditor) {
                fsPath = vscode.window.activeTextEditor.document.fileName;
            }
            try {
                await serverCommands.compareScript(loginData, fsPath);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Get script names
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.getScriptNames', async (param) => {
            try {
                await serverCommands.getScriptnames(loginData, param);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Install intellisense files
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.getPortalScriptingTSD', () => {
            intellisense.copyPortalScriptingTSD();
            intellisense.createJsconfigJson();
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.getFileTypesTSD', async () => {
            try {
                await intellisense.createFiletypesTSD(loginData);
                intellisense.copyPortalScriptingTSD();
                intellisense.createJsconfigJson();
            } catch (err) {
                //
            }
        })
    );

    // View documentation
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.viewDocumentation', (file) => {
            // file is not used, use active editor...
            documentation.viewDocumentation();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.showDocumentsVersion', () => {
            if (loginData.documentsVersion && loginData.documentsVersion.length > 0 && loginData.documentsVersion !== 'unknown') {
                const ver = getServerVersion(loginData.documentsVersion) + ' (' + loginData.documentsVersion + ')';
                vscode.window.showInformationMessage(`DOCUMENTS Version ${ver}`);
            } else {
                vscode.window.showWarningMessage('Version only available after executing command on server');
            }
        })
    );

    // Show imports
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.showImports', async (param) => {
            let fsPath: string | undefined;
            if (param && (typeof param._fsPath === 'string')) {
                fsPath = param._fsPath;
            }
            try {
                await serverCommands.showImports(loginData, fsPath, scriptChannel);
            } catch (err) {
                if (err) {
                    vscode.window.showErrorMessage(err);
                }
            }
            helpers.showWarning(loginData);
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


    if (isFolderOpen && vscode.workspace.rootPath) {

        // create activation file if it does not exist
        const activationFile = path.join(vscode.workspace.rootPath, helpers.CACHE_FILE);
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
                    serverCommands.uploadScriptOnSave(loginData, textDocument.fileName).then((value) => {
                        if (!value && disposableOnSave) {
                            disposableOnSave.dispose();
                        }
                    });
                }
            });
            context.subscriptions.push(disposableOnSave);
        }
    }


    // show warnings for deprecated files
    if (vscode.workspace && vscode.workspace.rootPath) {
        try {
            fs.readFileSync(path.join(vscode.workspace.rootPath, 'documents-scripting-settings.json'));
            vscode.window.showWarningMessage('Deprecated file "documents-scripting-settings.json" can be deleted!');
        } catch (err) {
            // no error
        }
        try {
            fs.readFileSync(path.join(vscode.workspace.rootPath, '.documents-scripting-cache'));
            vscode.window.showWarningMessage('Deprecated file ".documents-scripting-cache" can be deleted!');
        } catch (err) {
            // no error
        }
    }

    vscode.window.setStatusBarMessage('vscode-janus-debug is active');
}




export function deactivate(): undefined {
    ipcServer.dispose();
    launchJsonWatcher.dispose();
    serverConsole.hide();
    serverConsole.dispose();
    scriptChannel.hide();
    scriptChannel.dispose();
    return;
}
