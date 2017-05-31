'use strict';

import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import * as path from 'path';
import * as vscode from 'vscode';

// todo debugger
const initialConfigurations = [
    {
        name: 'Launch Script on Server',
        request: 'launch',
        type: 'janus',
        script: '',
        username: '',
        password: '',
        principal: '',
        host: 'localhost',
        applicationPort: 11000,
        debuggerPort: 8089,
        stopOnEntry: false,
        log: {
            fileName: '${workspaceRoot}/vscode-janus-debug-launch.log',
            logLevel: {
                default: 'Debug',
            },
        },
    },
    {
        name: 'Attach to Server',
        request: 'attach',
        type: 'janus',
        host: 'localhost',
        debuggerPort: 8089,
        log: {
            fileName: '${workspaceRoot}/vscode-janus-debug-attach.log',
            logLevel: {
                default: 'Debug',
            },
        },
    },
];



export async function createLoginData(_loginData: nodeDoc.LoginData): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        askForLoginData(_loginData).then(() => {
            createLaunchJson(_loginData).then(() => {
                resolve();
            }).catch((reason) => {
                // couldn't save login data,
                // doesn't matter, just leave a warning and continue anyway
                vscode.window.showWarningMessage('did not save login data: ' + reason);
                resolve();
            });
        }).catch((reason) => {
            reject(reason);
        });
    });
}

async function askForLoginData(_loginData: nodeDoc.LoginData): Promise<void> {
    console.log('askForLoginData');

    const SERVER: string = 'localhost';
    const PORT: number = 11000;
    const PRINCIPAL: string = 'dopaag';
    const USERNAME: string = 'admin';
    const PASSWORD = '';

    return new Promise<void>((resolve, reject) => {

        // showInputBox() returns a thenable(value) object,
        // that is, these objects always have a then(value) function,
        // value can't be empty iff it's predefined in options
        vscode.window.showInputBox({
            prompt: 'Please enter the hostname',
            value: SERVER,
            ignoreFocusOut: true,
        }).then((server): Thenable<string> => {
            if (server.length > 0) {
                _loginData.server = server;
                return vscode.window.showInputBox({
                    prompt: 'Please enter the port',
                    value: _loginData.port ? _loginData.port.toString() : PORT.toString(),
                    ignoreFocusOut: true,
                });
            }
            throw new Error('input login data cancelled');
        }).then((port): Thenable<string> => {
            if (port.length > 0) {
                _loginData.port = Number(port);
                return vscode.window.showInputBox({
                    prompt: 'Please enter the principal',
                    value: _loginData.principal ? _loginData.principal : PRINCIPAL,
                    ignoreFocusOut: true,
                });
            }
            throw new Error('input login data cancelled');
        }).then((principal): Thenable<string> => {
            if (principal.length > 0) {
                _loginData.principal = principal;
                return vscode.window.showInputBox({
                    prompt: 'Please enter the username (username.principal)',
                    value: _loginData.username ? _loginData.username : USERNAME,
                    ignoreFocusOut: true,
                });
            }
            throw new Error('input login data cancelled');
        }).then((username): Thenable<string> => {
            if (username.length > 0) {
                _loginData.username = username;
                return vscode.window.showInputBox({
                    prompt: 'Please enter the password',
                    value: PASSWORD,
                    password: true,
                    ignoreFocusOut: true,
                });
            }
            throw new Error('input login data cancelled');
        }).then((password): void => {
            if (password !== undefined) {
                _loginData.password = password;
                resolve();
            } else {
                throw new Error('input login data cancelled');
            }
        });
    });
}





async function createLaunchJson(_loginData: nodeDoc.LoginData): Promise<void> {
    console.log('createLaunchJson');

    return new Promise<void>((resolve, reject) => {
        let rootPath;

        if (!vscode.workspace) {
            reject('no workspace');
        } else {
            rootPath = vscode.workspace.rootPath;
        }

        if (rootPath) {
            const filename = path.join(rootPath, '.vscode', 'launch.json');
            fs.stat(filename, function(err, stats) {
                if (err) {
                    if ('ENOENT' === err.code) {
                        // launch.json doesn't exist, create the default
                        // launch.json for janus-debugger

                        initialConfigurations.forEach((config: any) => {
                            if (config.request === 'launch') {
                                config.host = _loginData.server;
                                config.applicationPort = _loginData.port;
                                config.principal = _loginData.principal;
                                config.username = _loginData.username;
                                config.password = _loginData.password;
                            }
                        });

                        const configurations = JSON.stringify(initialConfigurations, null, '\t').split('\n').map(line => '\t' + line).join('\n').trim();
                        const data = [
                            '{',
                            '\t// Use IntelliSense to learn about possible configuration attributes.',
                            '\t// Hover to view descriptions of existing attributes.',
                            '\t// For more information, visit',
                            '\t// https://github.com/otris/vscode-janus-debug/wiki/Launching-the-Debugger',
                            '\t"version": "0.2.0",',
                            '\t"configurations": ' + configurations,
                            '}',
                        ].join('\n');


                        nodeDoc.writeFile(data, filename, true).then(() => {
                            resolve();
                        }).catch((reason) => {
                            reject(reason);
                        });
                    } else {
                        reject(err);
                    }
                } else {
                    // launch.jsaon exists
                    // I don't dare to change it
                    reject('cannot overwrite existing launch.json');
                }
            });

        } else {
            reject('folder must be open to save login data');
        }
    });
}
