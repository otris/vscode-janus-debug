import * as nodeDoc from 'node-documents-scripting';
import { LogConfiguration, Logger } from 'node-file-log';
import * as path from 'path';
import * as vscode from 'vscode';
import { provideInitialConfigurations } from './config';
import * as documentation from './documentation';
import * as helpers from './helpers';
import * as intellisense from './intellisense';
import { VSCodeExtensionIPC } from './ipcServer';
import * as login from './login';
import * as serverCommands from './serverCommands';
import * as serverConsole from './serverConsole';
import { getExactVersion } from './serverVersion';
import * as transpile from './transpile';
import * as version from './version';
import * as wizard from './wizard';

// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

let ipcServer: VSCodeExtensionIPC;
let launchJsonWatcher: vscode.FileSystemWatcher;
let scriptChannel: vscode.OutputChannel;
let disposableOnSave: vscode.Disposable;





function initLaunchJsonWatcher(outputChannel: vscode.OutputChannel, loginData: nodeDoc.ConnectionInformation) {
    launchJsonWatcher = vscode.workspace.createFileSystemWatcher('**/launch.json', false, false, false);

    launchJsonWatcher.onDidCreate((file) => {
        if (serverConsole.autoConnectServerConsole && serverConsole.consoleObj) {
            outputChannel.appendLine('launch.json created; trying to connect...');
            serverConsole.reconnectServerConsole(serverConsole.consoleObj);
        }
        const fsPath = file ? file.fsPath : '';
        login.loadLoginInformationOnCreate(loginData, fsPath);
    });

    launchJsonWatcher.onDidChange((file) => {
        if (serverConsole.autoConnectServerConsole && serverConsole.consoleObj) {
            outputChannel.appendLine('launch.json changed; trying to (re)connect...');
            serverConsole.reconnectServerConsole(serverConsole.consoleObj);
        }
        if (file) {
            login.loadLoginInformation(loginData, file.fsPath);
        }
    });

    launchJsonWatcher.onDidDelete((file) => {
        // this function is only called, if launch.json is deleted directly,
        // if the whole folder .vscode is deleted, this function is not called!
        if (serverConsole.autoConnectServerConsole && serverConsole.consoleObj) {
            serverConsole.disconnectServerConsole(serverConsole.consoleObj);
        }
        loginData.resetLoginData();
    });
}

class JanusDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    /**
     * Massage a debug configuration just before a debug session is being launched,
     * e.g. add all missing attributes to the debug configuration.
     */
    public resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {

        // if launch.json is missing or empty allow quick access to
        // debugging by providing this config
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'javascript') {
                config.type = 'janus';
                config.name = 'Launch Script on Server';
                config.request = 'launch';
                config.script = '${file}';
                config.stopOnEntry = true;
            }
        }

        return config;
    }

    /**
     * Returns initial debug configurations.
     */
    public provideDebugConfigurations?(folder: vscode.WorkspaceFolder | undefined, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration[]> {
        return provideInitialConfigurations(vscode.workspace.rootPath);
    }
}

export function activate(context: vscode.ExtensionContext): void {

    // set extension path
    // get location fo the extensions source folder
    const thisExtension: vscode.Extension<any> | undefined = vscode.extensions.getExtension("otris-software.vscode-janus-debug");
    if (thisExtension !== undefined) {
        version.setExtensionPath(thisExtension.extensionPath);
    }

    // set up file logging
    const extensionLoggerConf = helpers.getLogConfiguration();
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
    serverConsole.readAutoConnectServerConsole();
    serverConsole.printVersion(serverChannel);
    serverConsole.initServerConsole(serverChannel);
    initLaunchJsonWatcher(serverChannel, loginData);

    ipcServer = new VSCodeExtensionIPC();

    // Register configuration provider
    context.subscriptions.push(
        vscode.debug.registerDebugConfigurationProvider('janus', new JanusDebugConfigurationProvider())
    );


    // Register commands

    // this command is used for the default password entry in launch.json
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.askForPassword', () => {
            return vscode.window.showInputBox({
                prompt: 'Please enter the password',
                password: true,
                ignoreFocusOut: true,
            });
        })
    );

    // Upload script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadScript', async (param) => {

            const wsp = helpers.getWorkspacePath(param, true);
            try {
                await serverCommands.uploadScript(loginData, (wsp ? wsp.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // generatePortalScript
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.generatePortalScript', async (param) => {

            const wsp = helpers.getWorkspacePath(param, true);
            try {
                await transpile.generatePortalScript((wsp ? wsp.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Upload all
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadScriptsFromFolder', async (param) => {

            const wsp = helpers.getWorkspacePath(param, false);
            try {
                await serverCommands.uploadAll(loginData, (wsp ? wsp.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Download script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.downloadScript', async (param) => {

            const wsp = helpers.getWorkspacePath(param, false);
            try {
                await serverCommands.downloadScript(loginData, (wsp ? wsp.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Download all scripts from server
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.downloadAllScripts', async (param) => {

            const wsp = helpers.getWorkspacePath(param, false);
            try {
                await serverCommands.downloadAllSelected(loginData, (wsp ? wsp.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Download all scripts that are inside the folder
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.reloadScripts', async (param) => {

            const wsp = helpers.getWorkspacePath(param, false);
            try {
                await serverCommands.reloadScripts(loginData, (wsp ? wsp.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Run script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.runScript', async (param) => {

            const wsp = helpers.getWorkspacePath(param, true);
            try {
                await serverCommands.runScript(loginData, (wsp ? wsp.fsPath : undefined), scriptChannel);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Upload and Debug script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.debugScript', async (param) => {

            const wsp = helpers.getWorkspacePath(param, true);
            try {
                let folder: vscode.WorkspaceFolder | undefined;
                if (vscode.workspace.workspaceFolders) {
                    folder = vscode.workspace.workspaceFolders[0];
                }

                let config: vscode.DebugConfiguration | undefined;
                vscode.workspace.getConfiguration('launch').configurations.forEach((element: vscode.DebugConfiguration) => {
                    if (element.type === 'janus' && element.request === 'launch') {
                        config = element;
                        config.portal = true;
                        config.script = (wsp ? wsp.fsPath : undefined);
                    }
                });

                if (!config) {
                    vscode.window.showErrorMessage("No suitable configuration for debugging found. Please add one in launch.json");
                    return;
                }

                serverCommands.uploadDebugScript(loginData, (wsp ? wsp.fsPath : undefined), scriptChannel);

                // This essentially calls the Debugger Extension's launchRequest. We take a
                // launch config and overwrite 'script' property.
                await vscode.debug.startDebugging(folder, config);

            } catch (err) {
                // Swallow
            }
            helpers.showWarning(loginData);
        })
    );

    // Upload and Run script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadRunScript', async (param) => {

            const wsp = helpers.getWorkspacePath(param, true);
            try {
                await serverCommands.uploadRunScript(loginData, (wsp ? wsp.fsPath : undefined), scriptChannel);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Compare script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.compareScript', async (param) => {

            const wsp = helpers.getWorkspacePath(param, true);
            try {
                await serverCommands.compareScript(loginData, (wsp ? wsp.fsPath : undefined));
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
            vscode.window.showInputBox({ placeHolder: "version?" }).then((version) => {
                intellisense.copyPortalScriptingTSD(version);
                intellisense.ensureJsconfigJson();
            });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.getAllTSD', async () => {
            await intellisense.getAllTypings(loginData, true);
        })
    );

    // wizard: download project
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.wizardDownloadProject', async (param) => {
            if (!thisExtension) {
                vscode.window.showErrorMessage("Unfortunately an unexpected error occurred...");
                return;
            }
            await wizard.downloadCreateProject(loginData, param, thisExtension.extensionPath);
        })
    );


    // View documentation
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.viewDocumentation', (file) => {
            // file is not used, use active editor...
            documentation.viewDocumentation();
        })
    );

    // Documents version
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.showDocumentsVersion', async () => {
            await serverCommands.getServerVersion(loginData);
            let docVer = getExactVersion(loginData.documentsVersion);
            if (docVer === loginData.documentsVersion) {
                docVer = '#' + docVer;
            }
            vscode.window.showInformationMessage(`DOCUMENTS Version on ${loginData.server} is ${docVer}`);
        })
    );

    // Show imports
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.showImports', async (param) => {

            const wsp = helpers.getWorkspacePath(param, true);
            try {
                await serverCommands.showImports(loginData, (wsp ? wsp.fsPath : undefined), scriptChannel);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // connect the sever console manually
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus.debug.connectServerConsole', (param) => {
            serverConsole.reconnectServerConsole(serverConsole.consoleObj);
        })
    );

    // disconnect the server console manually
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus.debug.disconnectServerConsole', (param) => {
            serverConsole.disconnectServerConsole(serverConsole.consoleObj);
        })
    );


    if (vscode.workspace.rootPath) {

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


    vscode.window.setStatusBarMessage('vscode-janus-debug is active');
}




export function deactivate(): undefined {
    ipcServer.dispose();
    launchJsonWatcher.dispose();
    serverConsole.consoleObj.hide();
    serverConsole.consoleObj.dispose();
    scriptChannel.hide();
    scriptChannel.dispose();
    return;
}
