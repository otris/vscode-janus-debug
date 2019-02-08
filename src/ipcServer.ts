import * as fs from 'fs';
import ipc = require('node-ipc');
import * as path from 'path';
import { window, workspace } from 'vscode';

// We use a UNIX Domain or Windows socket, respectively, for having a
// communication channel from the debug adapter process back to the extension.
// Socket file path is usually /tmp/vscode-janus-debug.sock or so on Linux or
// macOS. This communication channel is outside of VS Code's debug protocol and
// allows us to show input boxes or use other parts of the VS Code extension
// API that would otherwise be unavailable to us in the debug adapter.

// We use the process id in the socket id, to handle multiple opened windows
// in VS Code.

ipc.config.appspace = 'vscode-janus-debug.';
ipc.config.id = 'sock' + process.pid.toString();
ipc.config.retry = 1500;
ipc.config.silent = true;


/**
 * Acts as the server in our communication.
 *
 * @export
 * @class VSCodeExtension
 */
export class VSCodeExtensionIPC {

    public constructor() {
        console.log(`ipc server id: ${ipc.config.id}`);

        ipc.serve(this.serverCallback);
        ipc.server.start();

        process.on('exit', this.removeStaleSocket);
        process.on('uncaughtException', this.removeStaleSocket);
    }

    public dispose(): void {
        ipc.disconnect('sock' + process.pid.toString());
    }

    private removeStaleSocket() {
        console.log('removeStaleSocket');
        ipc.disconnect('sock' + process.pid.toString());
        const staleSocket = `${ipc.config.socketRoot}${ipc.config.appspace}${ipc.config.id}`;
        if (fs.existsSync(staleSocket)) {
            try {
                fs.unlinkSync(staleSocket);
            } catch (err) {
                // Disregard
            }
        }
    }

    private serverCallback(): void {

        // This is the "API" that we expose via this IPC mechanism
        ipc.server.on('showContextQuickPick', async (contextList: string[], socket) => {
            console.log('showContextQuickPick');

            // check for scripts with same name
            // const multiNames = contextList.filter((value, index, self) => (self.indexOf(value) !== index));

            const picked: string | undefined = await window.showQuickPick(contextList);

            // send answer in any case because server is waiting
            ipc.server.emit(socket, 'contextChosen', picked);
        });

        /**
         * The callback returns an array containing all files in workspace that match
         * the include and exclude pattern.
         * Additional the function checks the array for scripts with same basename, because
         * on server the scriptnames are unique. If there are duplicate scriptnames in
         * workspace, the user can choose the correct script, or they can choose to
         * simply ignore all scripts with  names.
         */
        ipc.server.on('findURIsInWorkspace', async (globPaterns: {include?: string, exclude?: string}, socket) => {
            console.log('findURIsInWorkspace');

            const include = globPaterns.include ? globPaterns.include : '**/*.js';
            const exclude = globPaterns.exclude ? globPaterns.exclude : '**/node_modules/**';
            const uris = await workspace.findFiles(include, exclude);

            // if multiple scripts with same name, user has to select
            const uriPaths: string[] = [];
            const uriNames: string[] = [];
            const ignored: string[] = [];
            let ignoreDuplicates = false;
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < uris.length; i++) {
                const currentPath = uris[i].fsPath;
                const currentName = path.basename(currentPath);
                const duplIndex = uriNames.indexOf(currentName);
                if (duplIndex >= 0) {
                    // duplicate script found
                    let selected: string | undefined = "";
                    if (!ignoreDuplicates) {
                        const message = `Multiple scripts with name '${currentName}', please select one`;
                        const ingoreMsg = "Ignore all scripts with same name";
                        const prevPath = uriPaths[duplIndex];
                        selected = await window.showQuickPick([prevPath, currentPath, ingoreMsg], {ignoreFocusOut: true, placeHolder: message});
                        if (selected === ingoreMsg || selected === undefined) {
                            ignoreDuplicates = true;
                            selected = "";
                        }
                    } else {
                        ignored.push(currentName);
                    }
                    uriPaths[duplIndex] = selected;
                    // uriNames[prevIndex] already set
                } else {
                    uriPaths.push(currentPath);
                    uriNames.push(currentName);
                }
            }

            if (ignored.length > 0) {
                window.showInformationMessage(`The following scripts will be ignored and cannot be debugged\n ${JSON.stringify(ignored)}`);
            }

            ipc.server.emit(socket, 'urisFound', uriPaths);
        });

        ipc.server.on('displaySourceNotice', async (message: any, socket) => {
            // console.log('displaySourceNotice');
            await window.showInformationMessage(message);
        });
    }
}
