import ipc = require('node-ipc');
import { Logger } from 'node-file-log';
import * as os from 'os';
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

    public async connect() {
        ipc.connectTo('sock', () => {

            ipc.of.sock.on('connect', () => {
                log.debug(`connected to VS Code extension`);
            });

            ipc.of.sock.on('disconnect', () => {
                log.debug(`disconnected from VS Code extension`);
            });

            ipc.of.sock.on('contextChosen', this.contextChosenDefaultHandler);
            ipc.of.sock.on('urisFound', this.urisFoundDefaultHandler);
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

    public async findURIsInWorkspace(): Promise<string[]> {
        log.debug('findURIsInWorkspace');

        const waitForResponse = timeout({
            promise: new Promise<string[]>(resolve => {
                ipc.of.sock.on('urisFound', (uris: string[]) => {
                    if (os.type() === 'Windows_NT') {
                        // Sanitize paths. Seriously, this is VS Code, a Microsoft product, _and_ Windows. Why isn't this working?
                        // "/c:/Users/test/Documents/lib.js", we'll remove the leading slash.
                        uris = uris.map(uri => {
                            if (uri.startsWith('/')) {
                                return uri.substring(1);
                            }
                            return uri;
                        }
                        );
                    }
                    log.debug(`found following files '${JSON.stringify(uris)}'`);
                    resolve(uris);
                });
            }),
            time: 6000,
            error: new Error('Request timed out'),
        });
        ipc.of.sock.emit('findURIsInWorkspace', '');
        let result: string[];
        try {
            result = await waitForResponse;
        } finally {
            ipc.of.sock.on('urisFound', this.urisFoundDefaultHandler);
        }
        return result;
    }

    private contextChosenDefaultHandler(data: any) {
        log.warn(`got 'contextChosen' message from VS Code extension but we haven't asked!`);
    }

    private urisFoundDefaultHandler(data: any) {
        log.warn(`got 'urisFound' message from VS Code extension but we haven't asked!`);
    }
}
