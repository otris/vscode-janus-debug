'use strict';

import * as assert from 'assert';
import { Response } from './protocol';
import { Logger } from './log';

export type ContextId = number;

export class Context {
    private _id: ContextId;

    public get id() { return this._id; }

    constructor(id: ContextId, private name: string, paused?: boolean) {
        this._id = id;
    }

    public pauseRequest(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            throw new Error("something bad happened");
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

    public getContext(id: ContextId): Context /* | undefined */ {
        return this.contextById.get(id);
    }

    public handleResponse(response: Response): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (response.contextId === undefined) {

                if (response.type === 'info' && response.subtype === 'contexts_list') {
                    log.debug('handleResponse: updating list of available contexts');

                    // Add new contexts
                    response.content.contexts.forEach(element => {
                        if (!this.contextById.has(element.contextId)) {
                            log.debug(`creating new context with id: ${element.contextId}`);
                            let newContext: Context = new Context(element.contextId, element.contextName, element.paused);
                            this.contextById.set(element.contextId, newContext);
                            // TODO: We should send a StoppedEvent in case the context is paused
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