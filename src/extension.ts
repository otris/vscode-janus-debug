'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    let disposable: vscode.Disposable;

    disposable = vscode.commands.registerCommand('extension.getHostName', () => {
        return vscode.window.showInputBox({
            placeHolder: "Please enter the IP of the host where the application runs on",
            value: "localhost",
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
