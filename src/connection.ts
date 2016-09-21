'use strict';

import { Socket } from 'net';
import { DebugProtocolTransport } from './transport';
import { Logger } from './log';
import { ContextCoordinator } from './context';

let log = Logger.create('DebugConnection');

export class DebugConnection {
    private transport: DebugProtocolTransport;
    private _coordinator: ContextCoordinator;

    public get coordinator(): ContextCoordinator {
        return this._coordinator;
    }

    constructor(socket: Socket) {
        this._coordinator = new ContextCoordinator();
        this.transport = new DebugProtocolTransport(socket);
        this.transport.on('response', (response) => {
            log.debug(`received response: ${JSON.stringify(response)}`);
            this.coordinator.handleResponse(response);
        });
    }

    public sendRequest(req: any): void {
        const message = req.toString();
        log.debug(`send request: ${message}`);
        this.transport.sendMessage(message);
    }

    public disconnect(): Promise<void> {
        return this.transport.disconnect();
    }
}