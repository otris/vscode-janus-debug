'use strict';

import { EventEmitter } from 'events';
import { Socket } from 'net';
import { ContextCoordinator } from './context';
import { Logger } from './log';
import { Command, Response } from './protocol';
import { DebugProtocolTransport } from './transport';

let log = Logger.create('DebugConnection');

export interface ConnectionLike {
    emit(event: string, ...args: any[]);
    sendRequest(request: Command, responseHandler?: (response: Response) => Promise<any>): Promise<any>;
    handleResponse(response: Response): void;
    disconnect(): Promise<void>;
}

/**
 * Represents a connection to a target.
 * @fires DebugConnection.newContext
 */
export class DebugConnection extends EventEmitter implements ConnectionLike {
    public readonly coordinator: ContextCoordinator;
    private transport: DebugProtocolTransport;
    private responseHandlers: Map<string, Function>;

    constructor(socket: Socket) {
        super();

        this.responseHandlers = new Map();
        this.coordinator = new ContextCoordinator(this);
        this.transport = new DebugProtocolTransport(socket);
        this.transport.on('response', this.handleResponse);
    }

    public handleResponse = (response: Response): void => {
        log.info(`handle response: ${JSON.stringify(response)}`);

        if (response.content.hasOwnProperty('id')) {
            const uuid: string = response.content.id;
            if (this.responseHandlers.has(uuid)) {
                log.debug(`found a response handler for response id "${uuid}"`);

                // Meant to be handled by a particular response handler function that was given when sending the
                // request
                let handler = this.responseHandlers.get(uuid);
                if (handler === undefined) {
                    throw new Error(`No response handler for ${uuid}`);
                }
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
    }

    public disconnect(): Promise<void> {
        return this.transport.disconnect();
    }

    /**
     * Send given request to the target.
     * @param {Command} request - The request that is send to the target.
     * @param {Function} responseHandler - An optional handler for the response from the target, if any.
     */
    public sendRequest(request: Command, responseHandler?: (response: Response) => Promise<any>): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            // If we have to wait for a response and handle it, make sure that we resolve after the handler function
            // has finished
            if (responseHandler) {
                this.registerResponseHandler(request.id, (response: Response) => {
                    responseHandler(response).then((value) => {
                        resolve(value);
                    }).catch((reason) => {
                        reject(reason);
                    });
                });
            }

            const message = request.toString();
            log.debug(`sendRequest: ${message.trim()}\\n`);
            this.transport.sendMessage(message);

            // If we don't have to wait for a response, resolve immediately
            if (!responseHandler) {
                resolve();
            }
        });
    }

    private registerResponseHandler(commandId: string, handler: Function): void {
        log.debug(`registerResponseHandler: adding handler function for command id: "${commandId}"`);
        this.responseHandlers.set(commandId, handler);
    }
}
