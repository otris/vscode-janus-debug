'use strict';

import { Socket } from 'net';
import { EventEmitter } from 'events';
import { DebugProtocolTransport } from './transport';
import { Logger } from './log';
import { ContextCoordinator } from './context';

let log = Logger.create('DebugConnection');

/** Represents a connection to a target.
 *
 * Following events are emitted:
 *
 * - 'newContext': The target just informed us about a new context. Parameters: contextId, contextName, stopped
 */
export class DebugConnection extends EventEmitter {
    private transport: DebugProtocolTransport;
    private _coordinator: ContextCoordinator;

    public get coordinator(): ContextCoordinator {
        return this._coordinator;
    }

    constructor(socket: Socket) {
        super();

        this._coordinator = new ContextCoordinator(this);
        this.transport = new DebugProtocolTransport(socket);
        this.transport.on('response', (response) => {
            log.debug(`received response: ${JSON.stringify(response)}`);
            this.coordinator.handleResponse(response);
        });
    }

    public sendRequest(msg: string): void {
        log.debug(`send request: ${msg}`);
        this.transport.sendMessage(msg);
    }

    public disconnect(): Promise<void> {
        return this.transport.disconnect();
    }
}