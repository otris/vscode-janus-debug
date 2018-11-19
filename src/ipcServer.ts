import * as fs from 'fs';
import ipc = require('node-ipc');
import { Logger } from 'node-file-log';
import { window, workspace } from 'vscode';

// We use a UNIX Domain or Windows socket, respectively, for having a
// communication channel from the debug adapter process back to the extension.
// Socket file path is usually /tmp/vscode-janus-debug.sock or so on Linux or
// macOS. This communication channel is outside of VS Code's debug protocol and
// allows us to show input boxes or use other parts of the VS Code extension
// API that would otherwise be  unavailable to us in the debug adapter.

ipc.config.appspace = 'vscode-janus-debug.';
ipc.config.id = 'sock';
ipc.config.retry = 1500;
ipc.config.silent = true;

const log = Logger.create('VSCodeExtensionIPC');

/**
 * Acts as the server in our communication.
 *
 * @export
 * @class VSCodeExtension
 */
export class VSCodeExtensionIPC {

    public constructor() {
        log.info('constructor');

        ipc.serve(this.serverCallback);
        ipc.server.start();

        process.on('exit', this.removeStaleSocket);
        process.on('uncaughtException', this.removeStaleSocket);
    }

    public dispose(): void {
        ipc.disconnect('sock');
    }

    private removeStaleSocket() {
        log.info('removeStaleSocket');
        ipc.disconnect('sock');
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
            log.info('showContextQuickPick');

            // check for scripts with same name
            // const multiNames = contextList.filter((value, index, self) => (self.indexOf(value) !== index));

            const picked: string | undefined = await window.showQuickPick(contextList);

            // send answer in any case because server is waiting
            ipc.server.emit(socket, 'contextChosen', picked);
        });

        ipc.server.on('findURIsInWorkspace', async (ignored: any, socket) => {
            log.info('findURIsInWorkspace');

            const uris = await workspace.findFiles('**/*.js', '**/node_modules/**', 1000);
            // todo use uri.fsPath
            const uriPaths = uris.map(uri => uri.path);
            if (uriPaths) {
                log.debug(`first uri path ${uriPaths[0]}`);
            }
            ipc.server.emit(socket, 'janusDebugUrisFound', uriPaths);
        });

        ipc.server.on('displaySourceNotice', async (message: any, socket) => {
            // log.info('displaySourceNotice');
            await window.showInformationMessage(message);
        });
    }
}
