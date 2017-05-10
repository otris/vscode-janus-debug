'use strict';

import { join } from 'path';
import * as vscode from 'vscode';
import { parseEntryPoint } from './config';

const initialConfigurations = [
    {
        name: 'Launch Script on Server',
        request: 'launch',
        type: 'janus',
        script: '',
        username: '',
        password: '${command.extension.vscode-janus-debug.askForPassword}',
        principal: '',
        host: 'localhost',
        applicationPort: 10000,
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

export function activate(context: vscode.ExtensionContext): void {

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

            // Get 'main' property from package.json iff there is a package.json. This is probably the primary entry
            // point for the program and we use it to set the "script" property in our initial configurations.

            if (vscode.workspace.rootPath) {
                // A folder is open in VS Code
                const packageJsonPath = join(vscode.workspace.rootPath, 'package.json');
                const entryPoint = parseEntryPoint(packageJsonPath);
                if (entryPoint) {
                    initialConfigurations.forEach((config: any) => {
                        if (config.hasOwnProperty('script')) {
                            config.script = entryPoint;
                        }
                    });
                }
            }

            const configurations = JSON.stringify(initialConfigurations, null, '\t')
                .split('\n').map(line => '\t' + line).join('\n').trim();
            return [
                '{',
                '\t"version": "0.2.0",',
                '\t"configurations": ' + configurations,
                '}',
            ].join('\n');

        }));
}

export function deactivate(): undefined {
    return;
}
