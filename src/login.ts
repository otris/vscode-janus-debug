'use strict';

import * as nodeDoc from 'node-documents-scripting';
import * as path from 'path';
import * as vscode from 'vscode';
import * as config from './config';

// tslint:disable-next-line:no-var-requires
const stripJsonComments = require('strip-json-comments');
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');



async function askForPassword(connection: nodeDoc.ConnectionInformation): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        const password = await vscode.window.showInputBox({
            prompt: 'Please enter the password',
            value: '',
            password: true,
            ignoreFocusOut: true,
        });

        // Note: empty passwords are fine
        if (password === undefined) {
            return reject(new Error('input password cancelled'));
        }

        connection.password = nodeDoc.getJanusPassword(password);

        resolve();
    });
}

async function askForLoginInformation(connection: nodeDoc.ConnectionInformation): Promise<string | undefined> {
    const SERVER: string = 'localhost';
    const PORT: number = 11000;
    const PRINCIPAL: string = 'dopaag';
    const USERNAME: string = 'admin';

    return new Promise<string | undefined>(async (resolve, reject) => {

        const server = await vscode.window.showInputBox({
            prompt: 'Please enter the hostname',
            value: SERVER,
            ignoreFocusOut: true,
        });

        if (!server) {
            return reject(new Error('input login data cancelled'));
        }

        const port = await vscode.window.showInputBox({
            prompt: 'Please enter the port',
            value: connection.port ? connection.port.toString() : PORT.toString(),
            ignoreFocusOut: true,
        });

        if (!port) {
            return reject(new Error('input login data cancelled'));
        }

        const principal = await vscode.window.showInputBox({
            prompt: 'Please enter the principal',
            value: connection.principal ? connection.principal : PRINCIPAL,
            ignoreFocusOut: true,
        });

        if (!principal) {
            return reject(new Error('input login data cancelled'));
        }

        const username = await vscode.window.showInputBox({
            prompt: 'Please enter the username (username.principal)',
            value: connection.username ? connection.username : USERNAME,
            ignoreFocusOut: true,
        });

        if (!username) {
            return reject(new Error('input login data cancelled'));
        }

        connection.server = server;
        connection.port = Number(port);
        connection.principal = principal;
        connection.username = username;

        const password = await vscode.window.showInputBox({
            prompt: 'Please enter the password',
            value: '',
            password: true,
            ignoreFocusOut: true,
        });

        // Note: empty passwords are fine
        if (password === undefined) {
            return reject(new Error('input login data cancelled'));
        }

        connection.password = nodeDoc.getJanusPassword(password);

        const savePw = await vscode.window.showQuickPick(["Yes", "No"], {placeHolder: "Save password to launch.json?"});
        if ("Yes" === savePw) {
            connection.askForPassword = false;
            resolve(password);

        } else {
            // set to true so the string to ask for password
            // is written to launch.json
            connection.askForPassword = true;
            resolve(undefined);
        }
    });
}


function createLaunchJson(loginInfo: nodeDoc.ConnectionInformation, plainPassword: string | undefined) {
    console.log('createLaunchJson');

    if (!vscode.workspace || !vscode.workspace.rootPath) {
        throw new Error('workspace folder missing');
    }

    const rootPath = vscode.workspace.rootPath;
    const filename = path.join(rootPath, '.vscode', 'launch.json');

    let pw = '${command:extension.vscode-janus-debug.askForPassword}';
    if (!loginInfo.askForPassword && typeof(plainPassword) === 'string') {
        pw = plainPassword;
    }

    const data = config.launchJsonString(rootPath, {
        host: loginInfo.server,
        applicationPort: loginInfo.port,
        principal: loginInfo.principal,
        username: loginInfo.username,
        password: pw,
        currentConfiguration: true
    });

    try {
        fs.ensureDirSync(path.join(rootPath, '.vscode'));
        // only create launch.json if it doesn't exist
        fs.writeFileSync(filename, data, { flag: "wx" });
        launchJsonCreatedByExtension = true;
    } catch (err) {
        throw err;
    }
}




export async function ensureLoginInformation(serverInfo: nodeDoc.ConnectionInformation): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {

        let plainPassword;
        const askForAllInfoRequired = !serverInfo.checkLoginData();
        const askForPasswordRequired = serverInfo.password === undefined;

        if (askForAllInfoRequired) {
            // ask user for login information...
            try {
                plainPassword = await askForLoginInformation(serverInfo);
            } catch (err) {
                return reject(err);
            }
            // ...and write login information to launch.json
            try {
                createLaunchJson(serverInfo, plainPassword);
            } catch (err) {
                // couldn't create launch.json, probably because it already exists
                vscode.window.showWarningMessage(err.message);
            }
        } else if (askForPasswordRequired) {
            try {
                await askForPassword(serverInfo);
            } catch (err) {
                return reject(err);
            }
        }

        if (!serverInfo.checkLoginData() || (undefined === serverInfo.password)) {
            return reject('getting login information or password failed');
        }

        resolve();
    });
}


/**
 * This function is called by the launch.json-watcher when launch.json is created.
 * When launch.json is created by this extension (see ensureLoginInformation() above),
 * the login information should not be loaded.
 */
let launchJsonCreatedByExtension = false;
export function loadLoginInformationOnCreate(login: nodeDoc.ConnectionInformation, configFile: string) {
    if (launchJsonCreatedByExtension) {
        launchJsonCreatedByExtension = false;
    } else if (configFile && configFile.length > 0) {
        loadLoginInformation(login, configFile);
    }
}




function loadConfiguration(connection: nodeDoc.ConnectionInformation, configuration: any) {
    connection.server = configuration.host;
    connection.port = configuration.applicationPort;
    connection.principal = configuration.principal;
    connection.username = configuration.username;
    if (config.commandAskForPassword === configuration.password) {
        connection.askForPassword = true;
        connection.password = undefined;
    } else {
        connection.askForPassword = false;
        connection.password = nodeDoc.getJanusPassword(configuration.password);
    }
    connection.sdsTimeout = configuration.sdsTimeout;
    connection.documentsVersion = 'unknown';
}


/**
 * Try to find a valid configuration in the configuration file and load it to the data structure.
 * Is called once on start and every time the configuration file is changed.
 */
export function loadLoginInformation(connection: nodeDoc.ConnectionInformation, configFile: string): boolean {
    connection.configFile = configFile;
    let configurations;

    try {
        const jsonContent = fs.readFileSync(connection.configFile, 'utf8');
        const jsonObject = JSON.parse(stripJsonComments(jsonContent));
        configurations = jsonObject.configurations;
    } catch (err) {
        return false;
    }

    if (!configurations) {
        return false;
    }

    let validConfigurations = 0;
    let loadConf;

    // count valid configurations and remember the first one
    configurations.forEach((configuration: any) => {
        if (configuration.type === 'janus' && configuration.request === 'launch') {
            if (validConfigurations === 0) {
                loadConf = configuration;
            }
            validConfigurations++;
        }
    });

    // if more than one valid configuration found, search for flag currentConfiguration
    if (validConfigurations > 1) {
        configurations.some((configuration: any) => {
            if (configuration.type === 'janus' && configuration.request === 'launch' && configuration.currentConfiguration) {
                loadConf = configuration;
                return true;
            }
        });
    }

    if (!loadConf) {
        return false;
    }

    // finally load the configuration
    loadConfiguration(connection, loadConf);

    return true;
}
