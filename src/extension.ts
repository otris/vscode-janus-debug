'use strict';

import * as fs from "fs";
import { isAbsolute, join } from 'path';
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
        host: "localhost",
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
        vscode.commands.registerCommand('extension.vscode-janus-debug.askForSourceFile', () => {
            return vscode.window.showInputBox({
                prompt: 'Enter the relative path to the source file you want to debug',
                value: 'src/jscript/test.js',
                ignoreFocusOut: true
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.vscode-janus-debug.provideInitialConfigurations', () => {

            let entryPoint: string | undefined = undefined;

            // Get 'main' property from package.json iff there is a package.json. This is probably the primary entry
            // point for the program

            const packageJsonPath = join(vscode.workspace.rootPath, 'package.json');

            try {
                const jsonContent = fs.readFileSync(packageJsonPath, 'utf8');
                const jsonObject = JSON.parse(jsonContent);
                if (jsonObject.main) {
                    entryPoint = jsonObject.main;
                } else if (jsonObject.scripts && typeof jsonObject.scripts.start === 'string') {
                    entryPoint = jsonObject.scripts.start.split(' ').pop();
                }
            } catch (err) {
                // Silently ignore
            }

            if (entryPoint) {
                entryPoint = isAbsolute(entryPoint) ? entryPoint : join('${workspaceRoot}', entryPoint);
                initialConfigurations.forEach((config: any) => {
                    if (config.hasOwnProperty('script')) {
                        config.script = entryPoint;
                    }
                });
            }

            const configurations = JSON.stringify(initialConfigurations, null, '\t')
                .split('\n').map((line) => '\t' + line).join('\n').trim();
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
