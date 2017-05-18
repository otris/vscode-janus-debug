'use strict';

import * as vscode from 'vscode';
import { provideInitialConfigurations } from './config';

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
            return provideInitialConfigurations(vscode.workspace.rootPath);
        }));
}

export function deactivate(): undefined {
    return;
}
