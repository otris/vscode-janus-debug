import { EventEmitter } from 'events';
import { Socket } from 'net';
import { Logger } from 'node-file-log';
import { ContextCoordinator } from './context';
import { Command, Response } from './protocol';
import { DebugProtocolTransport } from './transport';

const log = Logger.create('DebugConnection');

export interface ConnectionLike {
    emit(event: string, ...args: any[]): boolean;
    sendRequest(request: Command, responseHandler?: (response: Response) => Promise<any>): Promise<any>;
    handleResponse(response: Response): void;
    disconnect(): Promise<void>;
}

/**
 * Represents a connection to a target.
 *
 * @fires DebugConnection.newContext
 * @fires DebugConnection.contextPaused
 * @fires DebugConnection.error
 */
export class DebugConnection extends EventEmitter implements ConnectionLike {
    public readonly coordinator: ContextCoordinator;
    private transport: DebugProtocolTransport;
    private responseHandlers: Map<string, (response: Response) => void>;

    constructor(socket: Socket) {
        super();

        this.responseHandlers = new Map();
        this.coordinator = new ContextCoordinator(this);
        this.transport = new DebugProtocolTransport(socket);
        this.transport.on('response', this.handleResponse);
        this.transport.on('error', (reason: string) => {
            this.emit('error', reason);
        });
    }

    public handleResponse = (response: Response): void => {
        log.info(`handle response: ${JSON.stringify(response)}`);

        if (response.content.hasOwnProperty('id')) {
            const uuid: string = response.content.id;
            if (this.responseHandlers.has(uuid)) {
                // log.debug(`found a response handler for response id "${uuid}"`);

                // Meant to be handled by a particular response handler function that was given when sending the
                // request
                const handler = this.responseHandlers.get(uuid);
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

        if (response.type === "info" && response.subtype && response.subtype === "paused") {
            this.emit('contextPaused', response.contextId);
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
     * @param {Function} responseHandler - An optional handler function that is called as soon as a response arrives.
     */
    public sendRequest(request: Command, responseHandler?: (response: Response) => Promise<any>): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            // If we have to wait for a response and handle it, make sure that we resolve after the handler function
            // has finished
            if (responseHandler) {
                if (request.id === undefined) {
                    // Somebody gave us a responseHandler, but the command does not contain a request id (and the
                    // server does not accept one for this command, probably, namely for 'exit', 'next', 'stop')
                    log.warn(`sendRequest: responseHandler given but request has no ID: disregard`);
                } else {
                    this.registerResponseHandler(request.id, (response: Response) => {
                        responseHandler(response).then(value => {
                            resolve(value);
                        }).catch(reason => {
                            reject(reason);
                        });
                    });
                }
            }

            const message = request.toString();
            // log.debug(`sendRequest: ${message.trim()}\\n`);
            this.transport.sendMessage(message);

            // If we don't have to wait for a response, resolve immediately
            if (!responseHandler) {
                resolve();
            }
        });
    }

    private registerResponseHandler(requestId: string, handler: (response: Response) => void): void {
        // log.debug(`registerResponseHandler: adding handler function for request: "${requestId}"`);
        this.responseHandlers.set(requestId, handler);
    }
}
