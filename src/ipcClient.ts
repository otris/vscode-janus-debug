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
        this.serverSock = 'sock' + processId.toString();
        log.debug(`connect to VS Code extension (${this.serverSock})`);
        const connWithTimeout = timeout({
            promise: new Promise<void>((resolve) => {
                ipc.connectTo(this.serverSock, () => {

                    ipc.of[this.serverSock].on('connect', () => {
                        log.debug(`connected to VS Code extension`);
                        resolve();
                    });

                    ipc.of[this.serverSock].on('disconnect', () => {
                        log.debug(`disconnected from VS Code extension`);
                    });

                    ipc.of[this.serverSock].on('contextChosen', this.contextChosenDefault);
                    ipc.of[this.serverSock].on('urisFound', this.urisFoundDefault);
                    ipc.of[this.serverSock].on('displaySourceNotice', this.displaySourceNoticeDefault);
                });
            }),
            time: 6000,
            error: new Error('Request timed out')
        });
        await connWithTimeout;
    }

    public async disconnect(): Promise<void> {
        ipc.disconnect(this.serverSock);
    }

    public async showContextQuickPick(contextList: string[]): Promise<string> {
        // (2 * 60 * 1000) -> 2 min
        return this.ipcRequest<string>('showContextQuickPick', 'contextChosen', this.contextChosenDefault, (2 * 60 * 1000), contextList);
    }

    public async findURIsInWorkspace(): Promise<string[]> {
        return this.ipcRequest<string[]>('findURIsInWorkspace', 'urisFound', this.urisFoundDefault, 6000);
    }

    public async displaySourceNotice(message: string): Promise<void> {
        // log.debug('displaySourceNotice');

        // simply call emit without using ipcRequest function, because
        // we do not have to wait for an answer
        ipc.of[this.serverSock].emit('displaySourceNotice', message);
    }

    private async ipcRequest<T>(requestEvent: string, responseEvent: string, responseDefault: (data: any) => void, requestTimeout: number, requestParameter?: string[]): Promise<T> {
        log.debug(requestEvent);

        // replace default response handler temporarily
        let tmpHandler;
        ipc.of[this.serverSock].off(responseEvent, responseDefault);
        const reqWithTimeout = timeout({
            promise: new Promise<T>(resolve => {
                ipc.of[this.serverSock].on(responseEvent, tmpHandler = (result: T) => {
                    resolve(result);
                });
            }),
            time: requestTimeout,
            error: new Error('Request timed out')
        });

        // call the request and finally reset default response handler
        let returnValue: T;
        ipc.of[this.serverSock].emit(requestEvent, requestParameter);
        try {
            returnValue = await reqWithTimeout;
        } finally {
            ipc.of[this.serverSock].off(responseEvent, tmpHandler);
            ipc.of[this.serverSock].on(responseEvent, responseDefault);
        }

        return returnValue;
    }

    private contextChosenDefault(data: any) {
        log.warn(`got 'contextChosen' message from VS Code extension but we haven't asked!`);
    }
    private urisFoundDefault(data: any) {
        log.warn(`got 'urisFound' message from VS Code extension but we haven't asked!`);
    }
    private displaySourceNoticeDefault(data: any) {
        log.warn(`got 'displaySourceNotice' message from VS Code extension but we haven't asked!`);
    }
}
