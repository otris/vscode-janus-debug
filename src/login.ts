'use strict';

import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import * as path from 'path';
import * as vscode from 'vscode';
import * as config from './config';

// tslint:disable-next-line:no-var-requires
const stripJsonComments = require('strip-json-comments');



async function askForPassword(loginInfo: nodeDoc.ConnectionInformation): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        const password = await vscode.window.showInputBox({
            prompt: 'Please enter the password',
            value: '',
            password: true,
            ignoreFocusOut: true,
        });

        if (password === undefined) { // Note: empty passwords are fine
            return reject(new Error('input password cancelled'));
        }

        loginInfo.password = nodeDoc.getJanusPassword(password);

        resolve();
    });
}

async function askForLoginInformation(loginInfo: nodeDoc.ConnectionInformation): Promise<string | undefined> {
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
            value: loginInfo.port ? loginInfo.port.toString() : PORT.toString(),
            ignoreFocusOut: true,
        });

        if (!port) {
            return reject(new Error('input login data cancelled'));
        }

        const principal = await vscode.window.showInputBox({
            prompt: 'Please enter the principal',
            value: loginInfo.principal ? loginInfo.principal : PRINCIPAL,
            ignoreFocusOut: true,
        });

        if (!principal) {
            return reject(new Error('input login data cancelled'));
        }

        const username = await vscode.window.showInputBox({
            prompt: 'Please enter the username (username.principal)',
            value: loginInfo.username ? loginInfo.username : USERNAME,
            ignoreFocusOut: true,
        });

        if (!username) {
            return reject(new Error('input login data cancelled'));
        }

        loginInfo.server = server;
        loginInfo.port = Number(port);
        loginInfo.principal = principal;
        loginInfo.username = username;

        const password = await vscode.window.showInputBox({
            prompt: 'Please enter the password',
            value: '',
            password: true,
            ignoreFocusOut: true,
        });

        if (password === undefined) { // Note: empty passwords are fine
            return reject(new Error('input login data cancelled'));
        }

        loginInfo.password = nodeDoc.getJanusPassword(password);

        const savePw = await vscode.window.showQuickPick(["Yes", "No"], {placeHolder: "Save password to launch.json?"});
        if ("Yes" === savePw) {
            loginInfo.askForPassword = false;
            resolve(password);

        } else {
            // set to true so the string to ask for password
            // is written to launch.json
            loginInfo.askForPassword = true;
            resolve(undefined);
        }
    });
}


async function createLaunchJson(loginInfo: nodeDoc.ConnectionInformation, plainPassword: string | undefined) {
    console.log('createLaunchJson');

    if (!vscode.workspace || !vscode.workspace.rootPath) {
        throw new Error('workspace folder missing');
    }

    const rootPath = vscode.workspace.rootPath;
    const filename = path.join(rootPath, '.vscode', 'launch.json');

    // only create launch.json if it doesn't exist
    fs.stat(filename, function(err, stats) {
        if (err) {
            if ('ENOENT' === err.code) {
                // launch.json doesn't exist, create one
            } else {
                throw new Error('Unexpexted error in checking launch.json: ' + err.message);
            }
        } else {
            throw new Error('Cannot overwrite existing launch.json');
        }
    });


    let pw = '${command:extension.vscode-janus-debug.askForPassword}';
    if (!loginInfo.askForPassword && typeof(plainPassword) === 'string') {
        pw = plainPassword;
    }

    const data = config.provideInitialConfigurations(rootPath, {
        host: loginInfo.server,
        applicationPort: loginInfo.port,
        principal: loginInfo.principal,
        username: loginInfo.username,
        password: pw,
        currentConfiguration: true
    });

    try {
        fs.writeFileSync(filename, data);
        launchJsonCreatedByExtension = true;
    } catch (err) {
        throw new Error(err);
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
                vscode.window.showWarningMessage(err);
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




let launchJsonCreatedByExtension = false;

export function loadLoginInformationOnCreate(login: nodeDoc.ConnectionInformation, configFile: string) {
    if (launchJsonCreatedByExtension) {
        launchJsonCreatedByExtension = false;
    } else if (configFile && configFile.length > 0) {
        loadLoginInformation(login, configFile);
    }
}

export function loadLoginInformation(login: nodeDoc.ConnectionInformation, configFile: string): boolean {
    console.log('loadLoginInformation');
    login.configFile = configFile;

    try {
        const jsonContent = fs.readFileSync(login.configFile, 'utf8');
        const jsonObject = JSON.parse(stripJsonComments(jsonContent));
        const configurations = jsonObject.configurations;

        if (configurations) {
            configurations.forEach((configuration: any) => {
                if (configuration.type === 'janus' && configuration.request === 'launch' && configuration.currentConfiguration) {
                    login.server = configuration.host;
                    login.port = configuration.applicationPort;
                    login.principal = configuration.principal;
                    login.username = configuration.username;
                    if (config.commandAskForPassword === configuration.password) {
                        login.askForPassword = true;
                        login.password = undefined;
                    } else {
                        login.askForPassword = false;
                        login.password = nodeDoc.getJanusPassword(configuration.password);
                    }
                    login.sdsTimeout = configuration.sdsTimeout;
                }
            });
        }
    } catch (err) {
        return false;
    }

    return true;
}
