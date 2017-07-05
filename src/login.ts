﻿'use strict';

import * as fs from 'fs';
import * as nodeDoc from 'node-documents-scripting';
import * as path from 'path';
import * as vscode from 'vscode';
import { provideInitialConfigurations } from './config';

export async function createLoginData(_loginData: nodeDoc.LoginData): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {

        try {
            if (!_loginData.checkLoginData()) {
                await askForLoginData(_loginData);
                try {
                    await createLaunchJson(_loginData);
                } catch (err) {
                    // couldn't save login data,
                    // doesn't matter, just leave a warning and continue anyway
                    vscode.window.showWarningMessage('did not save login data: ' + err);
                    return resolve();
                }
            } else {
                await askForPassword(_loginData);
            }
        } catch (err) {
            return reject(err);
        }

        resolve();
    });
}


async function askForPassword(_loginData: nodeDoc.LoginData): Promise<void> {
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

        _loginData.password = password;

        resolve();
    });
}

async function askForLoginData(_loginData: nodeDoc.LoginData): Promise<void> {
    console.log('askForLoginData');

    const SERVER: string = 'localhost';
    const PORT: number = 11000;
    const PRINCIPAL: string = 'dopaag';
    const USERNAME: string = 'admin';

    return new Promise<void>(async (resolve, reject) => {

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
            value: _loginData.port ? _loginData.port.toString() : PORT.toString(),
            ignoreFocusOut: true,
        });

        if (!port) {
            return reject(new Error('input login data cancelled'));
        }

        const principal = await vscode.window.showInputBox({
            prompt: 'Please enter the principal',
            value: _loginData.principal ? _loginData.principal : PRINCIPAL,
            ignoreFocusOut: true,
        });

        if (!principal) {
            return reject(new Error('input login data cancelled'));
        }

        const username = await vscode.window.showInputBox({
            prompt: 'Please enter the username (username.principal)',
            value: _loginData.username ? _loginData.username : USERNAME,
            ignoreFocusOut: true,
        });

        if (!username) {
            return reject(new Error('input login data cancelled'));
        }

        _loginData.server = server;
        _loginData.port = Number(port);
        _loginData.principal = principal;
        _loginData.username = username;

        const password = await vscode.window.showInputBox({
            prompt: 'Please enter the password',
            value: '',
            password: true,
            ignoreFocusOut: true,
        });

        if (password === undefined) { // Note: empty passwords are fine
            return reject(new Error('input login data cancelled'));
        }

        _loginData.password = password;

        const savePw = await vscode.window.showQuickPick(["Yes", "No"], {placeHolder: "Save password to launch.json?"});
        if ("No" === savePw) {
            // if the password field of launch.json contains this string, the password shouldn't
            // be written to launch.json, instead the user should be asked for the password
            _loginData.askForPassword = true;
        }

        resolve();
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

                        let pw = '';
                        if (loginData.askForPassword) {
                            pw = '${command:extension.vscode-janus-debug.askForPassword}';
                        } else {
                            pw = loginData.password;
                        }
                        const data = provideInitialConfigurations(rootPath, {
                            host: loginData.server,
                            applicationPort: loginData.port,
                            principal: loginData.principal,
                            username: loginData.username,
                            password: pw
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
