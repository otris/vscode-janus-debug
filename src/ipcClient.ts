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
        // TODO: return new Promise<void>((resolve)...
        ipc.connectTo('sock', () => {

            ipc.of.sock.on('connect', () => {
                log.debug(`connected to VS Code extension`);
                // TODO: resolve();
            });

            ipc.of.sock.on('disconnect', () => {
                log.debug(`disconnected from VS Code extension`);
            });

            ipc.of.sock.on('contextChosen', this.contextChosenDefaultHandler);
            ipc.of.sock.on('urisFound', this.urisFoundDefaultHandler);
            ipc.of.sock.on('displaySourceNotice', this.displaySourceNoticeDefaultHandler);
        });
    }

    public async disconnect(): Promise<void> {
        ipc.disconnect('sock');
    }

    public async showContextQuickPick(contextList: string[]): Promise<string> {
        log.debug(`showContextQuickPick ${JSON.stringify(contextList)}`);
        // TODO: set handlers off, see findURIsInWorkspace
        // let tmpHandler;

        const waitForResponse = timeout({
            promise: new Promise<string>(resolve => {
                ipc.of.sock.on('contextChosen', (contextLabel: string) => {
                    // log.debug(`user picked '${contextLabel}'`);
                    resolve(contextLabel);
                });
            }),
            time: (2 * 60 * 1000), // 2 min
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
        let tmpHandler;

        // TODO
        // handlers are not replaced by 'on'
        // they must be set 'on' and 'off'
        // if only 'on' is called, the handlers are added!
        // ipc.of.sock.off('urisFound', this.urisFoundDefaultHandler);
        const waitForResponse = timeout({
            promise: new Promise<string[]>(resolve => {
                ipc.of.sock.on('urisFound', tmpHandler = (uris: string[]) => {
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
                    // log.debug(`found following files '${JSON.stringify(uris)}'`);
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
            // TODO
            // ipc.of.sock.off('urisFound', tmpHandler);
            ipc.of.sock.on('urisFound', this.urisFoundDefaultHandler);
        }
        return result;
    }

    public async displaySourceNotice(message: string): Promise<void> {
        // log.debug(`displaySourceNotice`);
        ipc.of.sock.emit('displaySourceNotice', message);
    }

    // TODO default handlers must be set off, otherwise their messages are always shown
    private contextChosenDefaultHandler(data: any) {
        // log.warn(`got 'contextChosen' message from VS Code extension but we haven't asked!`);
    }
    private urisFoundDefaultHandler(data: any) {
        // log.warn(`got 'urisFound' message from VS Code extension but we haven't asked!`);
    }
    private displaySourceNoticeDefaultHandler(data: any) {
        // log.warn(`got 'displaySourceNotice' message from VS Code extension but we haven't asked!`);
    }
}
