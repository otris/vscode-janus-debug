import ipc = require('node-ipc');
import { Logger } from 'node-file-log';
import { timeout } from 'promised-timeout';

ipc.config.appspace = 'vscode-janus-debug.';
ipc.config.id = 'debug_adapter';
ipc.config.retry = 1500;

const log = Logger.create('DebugAdapterIPC');

/**
 * Acts as the client in our communication.
 *
 * @export
 * @class DebugAdapter
 */
export class DebugAdapterIPC {

    private serverSock: string = 'sock';

    public async connect(processId: number) {

        // TODO: return new Promise<void>((resolve)...
        this.serverSock = 'sock' + processId.toString();
        log.debug(`connect to ${this.serverSock}`);
        ipc.connectTo(this.serverSock, () => {

            ipc.of[this.serverSock].on('connect', () => {
                log.debug(`connected to VS Code extension`);
                // TODO: resolve();
            });

            ipc.of[this.serverSock].on('disconnect', () => {
                log.debug(`disconnected from VS Code extension`);
            });

            ipc.of[this.serverSock].on('contextChosen', this.contextChosenDefaultHandler);
            ipc.of[this.serverSock].on('urisFound', this.urisFoundDefaultHandler);
            ipc.of[this.serverSock].on('displaySourceNotice', this.displaySourceNoticeDefaultHandler);
        });
    }

    public async disconnect(): Promise<void> {
        ipc.disconnect(this.serverSock);
    }

    public async showContextQuickPick(contextList: string[]): Promise<string> {
        // log.debug('showContextQuickPick');

        let tmpHandler;
        ipc.of[this.serverSock].off('contextChosen', this.contextChosenDefaultHandler);
        const waitForResponse = timeout({
            promise: new Promise<string>(resolve => {
                ipc.of[this.serverSock].on('contextChosen',  tmpHandler = (contextLabel: string) => {
                    resolve(contextLabel);
                });
            }),
            time: (2 * 60 * 1000), // 2 min
            error: new Error('Request timed out'),
        });
        ipc.of[this.serverSock].emit('showContextQuickPick', contextList);
        let result: string;
        try {
            result = await waitForResponse;
        } finally {
            ipc.of[this.serverSock].off('contextChosen', tmpHandler);
            ipc.of[this.serverSock].on('contextChosen', this.contextChosenDefaultHandler);
        }
        return result;
    }

    public async findURIsInWorkspace(): Promise<string[]> {
        // log.debug('findURIsInWorkspace');

        let tmpHandler;
        ipc.of[this.serverSock].off('urisFound', this.urisFoundDefaultHandler);
        const waitForResponse = timeout({
            promise: new Promise<string[]>(resolve => {
                ipc.of[this.serverSock].on('urisFound', tmpHandler = (uris: string[]) => {
                    resolve(uris);
                });
            }),
            time: 6000,
            error: new Error('Request timed out'),
        });
        ipc.of[this.serverSock].emit('findURIsInWorkspace', '');
        let result: string[];
        try {
            result = await waitForResponse;
        } finally {
            ipc.of[this.serverSock].off('urisFound', tmpHandler);
            ipc.of[this.serverSock].on('urisFound', this.urisFoundDefaultHandler);
        }
        return result;
    }

    public async displaySourceNotice(message: string): Promise<void> {
        // log.debug('displaySourceNotice');
        ipc.of[this.serverSock].emit('displaySourceNotice', message);
    }

    private contextChosenDefaultHandler(data: any) {
        // log.warn(`got 'contextChosen' message from VS Code extension but we haven't asked!`);
    }
    private urisFoundDefaultHandler(data: any) {
        log.warn(`got 'urisFound' message from VS Code extension but we haven't asked!`);
    }
    private displaySourceNoticeDefaultHandler(data: any) {
        // log.warn(`got 'displaySourceNotice' message from VS Code extension but we haven't asked!`);
    }
}
