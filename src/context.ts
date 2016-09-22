'use strict';

import * as assert from 'assert';
import { Response, Command } from './protocol';
import { Logger } from './log';
import { DebugConnection } from './connection';

export type ContextId = number;

export class Context {
    private _id: ContextId;
    private _name: string;

    public get id(): ContextId { return this._id; }

    public get name(): string { return this._name; }

    public isStopped(): boolean { return this.stopped; }

    constructor(private debugConnection: DebugConnection, id: ContextId, name: string, private stopped?: boolean) {
        this._id = id;
        this._name = name;
    }

    public pause(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let cmd = new Command('pause', this.id);
            this.debugConnection.sendRequest(cmd);
        });
    }

    public continue(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let cmd = new Command('continue', this.id);
            this.debugConnection.sendRequest(cmd);
        });
    }

    public handleResponse(response: Response): Promise<void> {
        return new Promise<void>(() => { });
    }
}

let log = Logger.create('ContextCoordinator');

/** Coordinates requests and responses for all available contexts.
 *
 * Resposibilities:
 * - Keep track of all available contexts of the target.
 * - Dispatch incoming responses to their corresponding context.
 */
export class ContextCoordinator {
    private contextById: Map<ContextId, Context> = new Map();

    constructor(private debugConnection: DebugConnection) { }

    public getContext(id: ContextId): Context /* | undefined */ {
        return this.contextById.get(id);
    }

    public handleResponse(response: Response): Promise<void> {
        log.debug('handleResponse');

        return new Promise<void>((resolve, reject) => {

            if (response.contextId === undefined) {

                // Not meant for a particular context

                if (response.type === 'info' && response.subtype === 'contexts_list') {
                    log.debug('updating list of available contexts');
                    assert.ok(response.content.hasOwnProperty('contexts'));

                    // Add new contexts
                    response.content.contexts.forEach(element => {
                        if (!this.contextById.has(element.contextId)) {
                            log.debug(`creating new context with id: ${element.contextId}`);
                            let newContext: Context = new Context(this.debugConnection, element.contextId, element.contextName,
                                element.paused);
                            this.contextById.set(element.contextId, newContext);

                            // Notify the frontend that we have a new context in the target
                            this.debugConnection.emit('newContext', newContext.id, newContext.name, newContext.isStopped());
                        }
                    });

                    // Purge the ones that no longer exist
                    let dead: ContextId[] = [];
                    this.contextById.forEach(context => {
                        if (!response.content.contexts.find(element => element.contextId === context.id)) {
                            log.debug(`context ${context.id} no longer exists`);
                            dead.push(context.id);
                        }
                    });
                    dead.forEach(id => this.contextById.delete(id));
                }
            } else {

                // Dispatch to the corresponding context

                log.debug(`handleResponse for contextId: ${response.contextId}`);
                let context: Context = this.contextById.get(response.contextId);
                assert.ok(context !== undefined, "response for unknown context");
                context.handleResponse(response);
            }
        });
    }
}