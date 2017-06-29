'use strict';

import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import * as path from 'path';
import * as vscode from 'vscode';
import { provideInitialConfigurations } from './config';

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
        let tmpServer: string;
        let tmpPort: string;
        let tmpPrincipal: string;
        let tmpUsername: string;

        // showInputBox() returns a thenable(value) object,
        // that is, these objects always have a then(value) function,
        // value can't be empty iff it's predefined in options
        vscode.window.showInputBox({
            prompt: 'Please enter the hostname',
            value: SERVER,
            ignoreFocusOut: true,
        }).then((server: string): string | Thenable<string> | never => {
            tmpServer = server;
            if (server.length > 0) {
                return vscode.window.showInputBox({
                    prompt: 'Please enter the port',
                    value: _loginData.port ? _loginData.port.toString() : PORT.toString(),
                    ignoreFocusOut: true,
                });
            }
            throw new Error('input login data cancelled');
        }).then((port: string): string | Thenable<string> | never => {
            if (port && typeof(port) === 'string' && port.length > 0) {
                tmpPort = port;
                return vscode.window.showInputBox({
                    prompt: 'Please enter the principal',
                    value: _loginData.principal ? _loginData.principal : PRINCIPAL,
                    ignoreFocusOut: true,
                });
            }
            throw new Error('input login data cancelled');
        }).then((principal: string): string | Thenable<string> | never => {
            if (principal.length > 0) {
                tmpPrincipal = principal;
                return vscode.window.showInputBox({
                    prompt: 'Please enter the username (username.principal)',
                    value: _loginData.username ? _loginData.username : USERNAME,
                    ignoreFocusOut: true,
                });
            }
            throw new Error('input login data cancelled');
        }).then((username: string): string | Thenable<string> | never => {
            if (username.length > 0) {
                tmpUsername = username;
                return vscode.window.showInputBox({
                    prompt: 'Please enter the password',
                    value: PASSWORD,
                    password: true,
                    ignoreFocusOut: true,
                });
            }
            throw new Error('input login data cancelled');
        }).then((password: string): void => {
            if (password !== undefined) {
                _loginData.password = password;
                _loginData.server = tmpServer;
                _loginData.port = Number(tmpPort);
                _loginData.principal = tmpPrincipal;
                _loginData.username = tmpUsername;
                resolve();
            } else {
                throw new Error('input login data cancelled');
            }
        });
    });
}

async function createLaunchJson(loginData: nodeDoc.LoginData): Promise<void> {
    console.log('createLaunchJson');

    return new Promise<void>((resolve, reject) => {
        let rootPath: string | undefined;

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
                        // launch.json doesn't exist, create one

                        const data = provideInitialConfigurations(rootPath, {
                            host: loginData.server,
                            applicationPort: loginData.port,
                            principal: loginData.principal,
                            username: loginData.username,
                            password: loginData.password,
                        });

                        nodeDoc.writeFile(data, filename, true).then(() => {
                            resolve();
                        }).catch((reason) => {
                            reject(reason);
                        });
                    } else {
                        reject(err);
                    }
                } else {
                    // launch.json exists
                    // I don't dare to change it
                    reject('cannot overwrite existing launch.json');
                }
            });

        } else {
            reject('folder must be open to save login data');
        }
    });
}
