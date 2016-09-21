'use strict';

import { Socket } from 'net';
import { DebugProtocolTransport } from './transport';
import { Logger } from './log';

let log = Logger.create('DebugConnection');

export class DebugConnection {
    private transport: DebugProtocolTransport

    constructor(socket: Socket) {
        this.transport = new DebugProtocolTransport(socket);
        this.transport.on('response', (response) => {
            log.debug(`received response: ${JSON.stringify(response)}`);
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