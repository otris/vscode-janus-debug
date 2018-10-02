import * as nodeDoc from 'node-documents-scripting';
import { LogConfiguration, Logger } from 'node-file-log';
import * as path from 'path';
import * as vscode from 'vscode';
import { provideInitialConfigurations } from './config';
import * as documentation from './documentation';
import * as extensionCommands from './extensionCommands';
import { extend } from './helpers';
import * as helpers from './helpers';
import * as intellisense from './intellisense';
import * as interactive from './interactive';
import { VSCodeExtensionIPC } from './ipcServer';
import * as login from './login';
import * as serverCommands from './serverCommands';
import { ServerConsole } from './serverConsole';
import { getExactVersion } from './serverVersion';
import * as transpile from './transpile';
import stripJsonComments = require('strip-json-comments');
import * as version from './version';
import * as wizard from './wizard';

// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

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



function getLogConfiguration(): LogConfiguration | undefined {
    const workspaceRoot = vscode.workspace.rootPath;
    const config = vscode.workspace.getConfiguration('vscode-janus-debug');
    const log: any = config.get("log");
    if (log && log.fileName && workspaceRoot) {
        return {
            fileName: log.fileName.replace(/[$]{workspaceRoot}/, workspaceRoot),
            logLevel: {
                "vscode-janus-debug": log.logLevel ? log.logLevel : "Debug"
            }
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
        fs.readFile(filePath, { encoding: 'utf-8', flag: 'r' }, (err: any, data: any) => {
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




function initServerConsole(outputChannel: vscode.OutputChannel) {
    outputChannel.appendLine('Extension activated');
    try {
        outputChannel.appendLine("Version: " + version.getVersion().toString(true));
    } catch (err) {
        //
    }
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
        const wsFolder = vscode.workspace.getWorkspaceFolder(file);
        if (wsFolder && wsFolder.index === 0) {
            login.loadLoginInformationOnCreate(loginData, file.fsPath);
        }
    });

    launchJsonWatcher.onDidChange((file) => {
        if (autoConnectServerConsole && serverConsole) {
            outputChannel.appendLine('launch.json changed; trying to (re)connect...');
            reconnectServerConsole(serverConsole);
        }
        const wsFolder = vscode.workspace.getWorkspaceFolder(file);
        if (wsFolder && wsFolder.index === 0) {
            login.loadLoginInformation(loginData, file.fsPath);
        }
    });

    launchJsonWatcher.onDidDelete((file) => {
        // this function is only called, if launch.json is deleted directly,
        // if the whole folder .vscode is deleted, this function is not called!
        if (autoConnectServerConsole && serverConsole) {
            disconnectServerConsole(serverConsole);
        }
        const wsFolder = vscode.workspace.getWorkspaceFolder(file);
        if (wsFolder && wsFolder.index === 0) {
            loginData.resetLoginData();
        }
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
    let conf = vscode.workspace.getConfiguration('vscode-janus-debug');

    // set extension path
    // get location fo the extensions source folder
    const thisExtension: vscode.Extension<any> | undefined = vscode.extensions.getExtension("otris-software.vscode-janus-debug");
    if (thisExtension !== undefined) {
        version.setExtensionPath(thisExtension.extensionPath);
    }

    // set up file logging
    const extensionLoggerConf = getLogConfiguration();
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

    // initServerConsole and initLaunchJsonWatcher access
    // the global variable autoConnectServerConsole
    // todo: create parameter autoConnectServerConsole
    autoConnectServerConsole = conf.get('serverConsole.autoConnect', false);
    initServerConsole(serverChannel);
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

            const pc = helpers.getPathContext(param, true);
            try {
                await serverCommands.uploadScript(loginData, (pc ? pc.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // generatePortalScript
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.generatePortalScript', async (param) => {

            const pc = helpers.getPathContext(param, true);
            try {
                await transpile.generatePortalScript((pc ? pc.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Upload all
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.uploadScriptsFromFolder', async (param) => {

            const pc = helpers.getPathContext(param, false);
            try {
                await serverCommands.uploadAll(loginData, (pc ? pc.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Download script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.downloadScript', async (param) => {

            const pc = helpers.getPathContext(param, false);
            try {
                await serverCommands.downloadScript(loginData, (pc ? pc.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Download all scripts from server
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.downloadAllScripts', async (param) => {

            const pc = helpers.getPathContext(param, false);
            try {
                await serverCommands.downloadAllSelected(loginData, (pc ? pc.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Download all scripts that are inside the folder
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.reloadScripts', async (param) => {

            const pc = helpers.getPathContext(param, false);
            try {
                await serverCommands.reloadScripts(loginData, (pc ? pc.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Run script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.runScript', async (param) => {

            const pc = helpers.getPathContext(param, true);
            try {
                await serverCommands.runScript(loginData, (pc ? pc.fsPath : undefined), scriptChannel);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Upload and Debug script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.debugScript', async (param) => {

            const pc = helpers.getPathContext(param, true);
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
                        config.script = (pc ? pc.fsPath : undefined);
                    }
                });

                if (!config) {
                    vscode.window.showErrorMessage("No suitable configuration for debugging found. Please add one in launch.json");
                    return;
                }

                serverCommands.uploadDebugScript(loginData, (pc ? pc.fsPath : undefined), scriptChannel);

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

            const pc = helpers.getPathContext(param, true);
            try {
                await serverCommands.uploadRunScript(loginData, (pc ? pc.fsPath : undefined), scriptChannel);
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Compare script
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.compareScript', async (param) => {

            const pc = helpers.getPathContext(param, true);
            try {
                await serverCommands.compareScript(loginData, (pc ? pc.fsPath : undefined));
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

    // Show server file
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.showImports', async (param) => {

            const pc = helpers.getPathContext(param, true);
            try {
                await serverCommands.showImports(loginData, (pc ? pc.fsPath : undefined));
            } catch (err) {
                //
            }
            helpers.showWarning(loginData);
        })
    );

    // Export XML ...
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.exportXML', async (param) => {
            await extensionCommands.exportXML(loginData);
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


    // Upload script on save
    const autoUploadEnabled = conf.get('uploadOnSaveGlobal', true);
    if (autoUploadEnabled) {
        disposableOnSave = vscode.workspace.onDidSaveTextDocument(async (textDocument) => {
            if ('.js' !== path.extname(textDocument.fileName)) {
                return;
            }
            // configuration must be reloaded
            conf = vscode.workspace.getConfiguration('vscode-janus-debug');
            const answer = await interactive.ensureUploadOnSave(conf, path.basename(textDocument.fileName, '.js'));
            if (interactive.autoUpload.yes === answer) {
                await serverCommands.uploadScript(loginData, textDocument.fileName);
            } else if (interactive.autoUpload.neverAsk === answer) {
                if (disposableOnSave) {
                    disposableOnSave.dispose();
                }
            }
        });
        context.subscriptions.push(disposableOnSave);
    }


    // create activation file if it does not exist
    if (vscode.workspace.workspaceFolders) {
        const activationFile = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, helpers.CACHE_FILE);
        try {
            fs.readFileSync(activationFile);
        } catch (err) {
            if (err.code === 'ENOENT') {
                fs.writeFileSync(activationFile, '');
            }
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
