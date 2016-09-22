'use strict';

import { Socket } from 'net';
import { EventEmitter } from 'events';
import { DebugProtocolTransport } from './transport';
import { Command, Response } from './protocol';
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
    private responseHandlers: Map<string, Function>;
    private _coordinator: ContextCoordinator;

    public get coordinator(): ContextCoordinator {
        return this._coordinator;
    }

    constructor(socket: Socket) {
        super();

        this.responseHandlers = new Map();
        this._coordinator = new ContextCoordinator(this);
        this.transport = new DebugProtocolTransport(socket);
        this.transport.on('response', (response: Response) => {
            log.info(`handle response: ${JSON.stringify(response)}`);

            if (response.content.hasOwnProperty('id')) {
                const uuid: string = response.content.id;
                if (this.responseHandlers.has(uuid)) {
                    log.debug(`found a response handler for response id "${uuid}"`);

                    // Meant to be handled by a particular response handler function that was given when sending the
                    // request
                    let handler = this.responseHandlers.get(uuid);
                    try {
                        handler(response);
                    } finally {
                        this.responseHandlers.delete(uuid);
                    }
                    return;
                }
            }

            // No response handler; let the context coordinator decide on how to handle the response
            this.coordinator.handleResponse(response);
        });
    }

    public disconnect(): Promise<void> {
        return this.transport.disconnect();
    }

    public sendRequest(req: Command, responseHandler?: Function): void {
        let message = req.toString();
        if (responseHandler !== undefined) {
            this.registerResponseHandler(req.id, responseHandler);
        }
        log.debug(`sendRequest: ${String(message).trim()}`);
        this.transport.sendMessage(message);
    }

    private registerResponseHandler(commandId: string, handler: Function): void {
        log.debug(`registerResponseHandler: adding handler function for command id: "${commandId}"`);
        this.responseHandlers.set(commandId, handler);
    }
}