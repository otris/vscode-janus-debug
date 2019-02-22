import * as fs from 'fs';
import ipc = require('node-ipc');
import * as path from 'path';
import { window, workspace } from 'vscode';
import { LocalPaths, LocalSourcesPattern } from './localSource';

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

            const picked: string | undefined = await window.showQuickPick(contextList, {ignoreFocusOut: true});

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
        ipc.server.on('findURIsInWorkspace', async (globPaterns: LocalSourcesPattern, socket) => {
            console.log('findURIsInWorkspace');

            const include = globPaterns.include ? globPaterns.include : '**/*.js';
            const exclude = globPaterns.exclude ? globPaterns.exclude : '**/node_modules/**';
            const uris = await workspace.findFiles(include, exclude);

            // if multiple scripts with same name, collect all paths
            const uriPaths: LocalPaths[] = [];
            const uriNames: string[] = [];

            let ignoreDuplicates = false;
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < uris.length; i++) {
                const currentPath = uris[i].fsPath;
                const currentName = path.basename(currentPath);
                const duplicate = uriPaths.find((fspaths) => {
                    if (fspaths.name === currentName) {
                        return true;
                    }
                    return false;
                });
                if (duplicate) {
                    // duplicate script found
                    let selected: string | undefined = "";
                    if (ignoreDuplicates) {
                        if (duplicate.path) {
                            duplicate.paths.push(duplicate.path);
                            duplicate.path = undefined;
                        }
                        duplicate.paths.push(currentPath);
                    } else {
                        if (duplicate.path) {
                            const msgSameName = `Multiple scripts with name '${currentName}', please select one`;
                            const msgIgnoreSameNames = "Ignore all scripts with same name";
                            selected = await window.showQuickPick([duplicate.path, currentPath, msgIgnoreSameNames], {ignoreFocusOut: true, placeHolder: msgSameName});
                            if (selected === msgIgnoreSameNames || selected === undefined) {
                                ignoreDuplicates = true;
                                duplicate.paths.push(duplicate.path);
                                duplicate.path = undefined;
                                duplicate.paths.push(currentPath);
                            } else if (selected === duplicate.path) {
                                // duplicate.path = prevPath; // already set
                                duplicate.paths.push(currentPath);
                            } else if (selected === currentPath) {
                                duplicate.path = currentPath;
                                duplicate.paths.push(duplicate.path);
                            }
                        } else {
                            duplicate.path = currentPath;
                        }
                    }
                } else {
                    uriPaths.push({name: currentName, path: currentPath, paths: []});
                    uriNames.push(currentName);
                }
            }

            ipc.server.emit(socket, 'urisFound', uriPaths);
        });

        ipc.server.on('displaySourceNotice', async (message: any, socket) => {
            // console.log('displaySourceNotice');
            await window.showInformationMessage(message);
        });
    }
}
