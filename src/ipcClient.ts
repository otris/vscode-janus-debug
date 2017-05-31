import ipc = require('node-ipc');
import { timeout } from 'promised-timeout';
import { Logger } from './log';

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

    public async connect() {
        ipc.connectTo('sock', () => {

            ipc.of.sock.on('connect', () => {
                log.debug(`connected to VS Code extension`);
            });

            ipc.of.sock.on('disconnect', () => {
                log.debug(`disconnected from VS Code extension`);
            });

            ipc.of.sock.on('contextChosen', this.contextChosenDefaultHandler);
        });
    }

    public async disconnect(): Promise<void> {
        ipc.disconnect('sock');
    }

    public async showContextQuickPick(contextList: string[]): Promise<string> {
        log.debug(`showContextQuickPick ${JSON.stringify(contextList)}`);

        const waitForResponse = timeout({
            promise: new Promise<string>(resolve => {
                ipc.of.sock.on('contextChosen', (contextLabel: string) => {
                    log.debug(`user picked '${contextLabel}'`);
                    resolve(contextLabel);
                });
            }),
            time: 10000,
            error: new Error('Request timed out'),
        });
        ipc.of.sock.emit('showContextQuickPick', contextList);
        let result: string;
        try {
            result = await waitForResponse;
        } finally {
            ipc.of.sock.on('contextChosen', this.contextChosenDefaultHandler);
        }
        return result;
    }

    private contextChosenDefaultHandler(data: any) {
        log.warn(`got 'contextChosen' message from VS Code extension but we haven't asked!`);
    }
}
