'use strict';

import { Socket } from 'net';
import { DebugProtocolTransport } from './transport';

export class DebugConnection {
    private transport: DebugProtocolTransport

    constructor(socket: Socket) {
        this.transport = new DebugProtocolTransport(socket);
    }

    public disconnect(): Promise<void> {
        return this.transport.disconnect();
    }
}