'use strict';

import * as assert from 'assert';
import { Response, Command, ErrorCode, StackFrame, Variable } from './protocol';
import { Logger } from './log';
import { ConnectionLike } from './connection';

export type ContextId = number;

let contextLog = Logger.create('Context');

export class Context {
    public isStopped(): boolean {
        return this.stopped ? this.stopped : false;
    }

    constructor(private connection: ConnectionLike,
        public readonly id: ContextId,
        public readonly name: string,
        private readonly stopped?: boolean) {

    }

    public pause(): Promise<void> {
        contextLog.debug(`request 'pause' for context ${this.id}`);

        let req = new Command('pause', this.id);
        return this.connection.sendRequest(req, (res: Response) => {

            return new Promise<void>((resolve, reject) => {
                if (res.type === 'error') {
                    if (res.content.code === ErrorCode.IS_PAUSED) {
                        contextLog.warn(`context ${this.id} is already paused`);
                        resolve();
                        return;
                    }

                    reject(new Error(res.content.message));
                    return;
                }

                resolve();
            });
        });
    }

    public continue(): Promise<void> {
        contextLog.debug(`request 'continue' for context ${this.id}`);

        let cmd = new Command('continue', this.id);
        return this.connection.sendRequest(cmd);
    }

    public getStacktrace(): Promise<StackFrame[]> {
        contextLog.debug(`request 'get_stacktrace' for context ${this.id}`);

        let req = new Command('get_stacktrace', this.id);
        return this.connection.sendRequest(req, (res: Response) => {
            return new Promise<StackFrame[]>((resolve, reject) => {
                if (res.type === 'error') {
                    reject(new Error(res.content.message));
                } else {
                    let stacktrace: StackFrame[] = [];
                    assert.ok(res.content.stacktrace);
                    resolve(res.content.stacktrace);
                }
            });
        });
    }

    /**
     * Returns all variables in the top-most frame of this context.
     */
    public getVariables(): Promise<Variable[]> {
        contextLog.debug(`request 'get_variables' for context ${this.id}`);

        let req = Command.getVariables(this.id, {
            depth: 0,
            options: {
                "show-hierarchy": true,
                "evaluation-depth": 1
            }
        });
        return this.connection.sendRequest(req, (res: Response) => {
            return new Promise<Variable[]>((resolve, reject) => {
                if (res.type === 'error') {
                    reject(new Error(res.content.message));
                } else {

                    let variables: Variable[] = [];

                    // This should be named 'frames' because it really holds all frames and for each frame
                    // an array of variables
                    assert.equal(res.content.variables.length, 1);

                    res.content.variables.forEach(element => {

                        // Each element got a stackElement which descripes the frame and a list of
                        // variables.

                        element.variables.forEach(variable => {
                            variables.push(variable);
                        });
                    });

                    resolve(variables);
                }
            });
        });
    }

    public next(): Promise<void> {
        contextLog.debug(`request 'next' for context ${this.id}`);
        return this.connection.sendRequest(new Command('next', this.id));
    }

    public handleResponse(response: Response): Promise<void> {
        contextLog.debug(`handleResponse ${JSON.stringify(response)} for context ${this.id}`);
        return Promise.resolve();
    }
}

let coordinatorLog = Logger.create('ContextCoordinator');

/**
 * Coordinates requests and responses for all available contexts.
 *
 * Resposibilities:
 * - Keep track of all available contexts of the target.
 * - Dispatch incoming responses to their corresponding context.
 */
export class ContextCoordinator {
    private contextById: Map<ContextId, Context> = new Map();

    constructor(private connection: ConnectionLike) { }

    public getAllAvailableContexts(): Context[] {
        coordinatorLog.debug(`getAllAvailableContexts`);

        // Meh, this is shitty. We return (most probably) an old state here. But protocol does not allow an id send in
        // an 'get_available_contexts' request so no way to handle and synchronize with the particular response here
        this.connection.sendRequest(new Command('get_available_contexts'));
        return Array.from(this.contextById.values());
    }

    public getContext(id: ContextId): Context {
        let context = this.contextById.get(id);
        if (context === undefined) {

            // Well, somebody requests a context that does not exist. What could we possibly do?

            let contents = Array.from(this.contextById.values());
            coordinatorLog.warn(
                `unknown context ${id} requested; available: ${contents.map(context => { return context.id; })}`);

            // Shitty but maybe helps in cases we're caught by surprise
            // if (id === 0 && contents.length === 1) {
            //    return contents[0];
            // }

            throw new Error(`No such context ${id}`);
        }
        return context;
    }

    public handleResponse(response: Response): Promise<void> {
        coordinatorLog.debug(`handleResponse ${JSON.stringify(response)}`);

        return new Promise<void>((resolve, reject) => {

            if (response.contextId === undefined) {

                // Not meant for a particular context

                if (response.type === 'info' && response.subtype === 'contexts_list') {
                    coordinatorLog.debug('updating list of available contexts');
                    assert.ok(response.content.hasOwnProperty('contexts'));

                    // Add new contexts
                    response.content.contexts.forEach(element => {
                        if (!this.contextById.has(element.contextId)) {
                            coordinatorLog.debug(`creating new context with id: ${element.contextId}`);
                            let newContext: Context = new Context(this.connection, element.contextId, element.contextName,
                                element.paused);
                            this.contextById.set(element.contextId, newContext);

                            // Notify the frontend that we have a new context in the target
                            this.connection.emit('newContext', newContext.id, newContext.name, newContext.isStopped());
                        }
                    });

                    // Purge the ones that no longer exist
                    let dead: ContextId[] = [];
                    this.contextById.forEach(context => {
                        if (!response.content.contexts.find(element => element.contextId === context.id)) {
                            coordinatorLog.debug(`context ${context.id} no longer exists`);
                            dead.push(context.id);
                        }
                    });
                    dead.forEach(id => this.contextById.delete(id));
                }
            } else {

                // Dispatch to the corresponding context

                let context: Context | undefined = this.contextById.get(response.contextId);
                if (context === undefined) {
                    throw new Error(`response for unknown context`);
                }
                context.handleResponse(response);
            }
        });
    }
}