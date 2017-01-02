'use strict';

import * as fs from "fs";
import { join } from 'path';
import * as vscode from 'vscode';

const initialConfigurations = [
    {
        name: "Launch script on server",
        request: "launch",
        type: "janus",
        script: "",
        host: "localhost",
        port: 10000,
        stopOnEntry: false,
        log: {
            fileName: "${workspaceRoot}/vscode-janus-debug-launch.log",
            logLevel: {
                default: "Debug",
            },
        },
    },
    {
        name: "Attach to server",
        request: "attach",
        type: "janus",
        host: "${workspaceRoot}/${command.AskForHostName}",
        port: 8089,
        log: {
            fileName: "${workspaceRoot}/vscode-janus-debug-attach.log",
            logLevel: {
                default: "Debug",
            },
        },
    },
];

export function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.getHostName', () => {
            return vscode.window.showInputBox({
                placeHolder: "Please enter the IP of the host where the application runs on",
                value: "localhost",
            });
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.provideInitialConfigurations', () => {

            /*
            const packageJsonPath = join(vscode.workspace.rootPath, 'package.json');

            try {
                const jsonContent = fs.readFileSync(packageJsonPath, 'utf8');
                const jsonObject = JSON.parse(jsonContent);
            } catch (err) {
                // Silently ignore
            }
            */

            const configurations = JSON.stringify(initialConfigurations, null, '\t');
            return [
                '{',
                '\t// Use IntelliSense to learn about possible configuration attributes.',
                '\t// Hover to view descriptions of existing attributes.',
                '\t// For more information, visit: https://lalala',
                '\t"version": "0.2.0",',
                '\t"configurations": ' + configurations,
                '}',
            ].join('\n');

        }));
}

export function deactivate() {
    /* */
}
