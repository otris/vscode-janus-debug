import * as fs from 'fs';
import ipc = require('node-ipc');
import { window } from 'vscode';

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

/**
 * Acts as the server in our communication.
 *
 * @export
 * @class VSCodeExtension
 */
export class VSCodeExtensionIPC {

    public constructor() {
        ipc.serve(this.serverCallback);
        ipc.server.start();

        process.on('exit', this.removeStaleSocket);
        process.on('uncaughtException', this.removeStaleSocket);
    }

    public dispose(): void {
        ipc.disconnect('sock');
    }

    private removeStaleSocket() {
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
        ipc.server.on('showContextQuickPick', async (contextList: string[], socket) => {
            // TODO: create and pass cancellation token
            const picked: string | undefined = await window.showQuickPick(contextList);
            if (picked) {
                ipc.server.emit(socket, 'contextChosen', picked);
            }
        });
    }
}
