'use strict';

import * as assert from 'assert';
import { EventEmitter } from 'events';
import { ConnectionLike } from '../src/connection';
import { ContextCoordinator } from '../src/context';
import { Command, ErrorCode, parseResponse, Response, variableValueToString } from '../src/protocol';

suite('context coordinator coordinates requests and responses', () => {

    class MockConnection extends EventEmitter implements ConnectionLike {
        public sendRequest(request: Command, responseHandler?: (response: Response) => Promise<any>): Promise<any> {
            return Promise.resolve();
        }

        public handleResponse(response: Response): void {
            /* */
        }

        public disconnect(): Promise<void> {
            return Promise.resolve();
        }
    }

    let coordinator: ContextCoordinator;
    let mockConnection: MockConnection;
    let eventsEmitted: any[] = [];

    setup(() => {
        mockConnection = new MockConnection();
        coordinator = new ContextCoordinator(mockConnection);
        mockConnection.on('newContext', (contextId: number, contextName: string, stopped: boolean) => {
            eventsEmitted.push({ contextId, contextName, stopped });
        });
    });

    teardown(() => {
        eventsEmitted = [];
    });

    test('has no contexts after construction', () => {
        assert.equal(coordinator.getAllAvailableContexts().length, 0);
        assert.throws(() => { coordinator.getContext(23); }, 'No such context');
    });

    suite('a contexts_list response should…', () => {

        const response: Response = {
            content: {
                contexts: [{
                    contextId: 7,
                    contextName: 'seventh context',
                    paused: false,
                },
                {
                    contextId: 8,
                    contextName: 'eighth context',
                    paused: true,
                }],
            },
            subtype: 'contexts_list',
            type: 'info',
        };

        test('remember all contexts in the response', done => {
            coordinator.handleResponse(response).then(() => {
                const contexts = coordinator.getAllAvailableContexts();

                assert.equal(contexts.length, 2);
                assert.throws(() => { coordinator.getContext(23); }, 'No such context');

                let context = coordinator.getContext(7);
                assert.equal(context.id, 7);
                assert.equal(context.name, 'seventh context');
                assert.equal(context.isStopped(), false);

                context = coordinator.getContext(8);
                assert.equal(context.id, 8);
                assert.equal(context.name, 'eighth context');
                assert.equal(context.isStopped(), true);
                done();
            }).catch(err => done(err));
        });

        test('emit a newContext event as soon a new context is found', done => {
            coordinator.handleResponse(response).then(() => {
                assert.equal(eventsEmitted.length, 2);
                done();
            }).catch(err => done(err));
        });

        test('emit a newContext event only for unknown contexts', done => {

            coordinator.handleResponse(response).then(() => {

                // One more context got added
                const newResponse = response;
                newResponse.content.contexts.push({
                    contextId: 9,
                    contextName: 'ninth context',
                    paused: false,
                });

                eventsEmitted = []; // Reset events

                coordinator.handleResponse(newResponse).then(() => {
                    assert.equal(eventsEmitted.length, 1);
                    assert.equal(eventsEmitted[0].contextId, 9);
                    assert.equal(eventsEmitted[0].contextName, 'ninth context');
                    assert.equal(eventsEmitted[0].stopped, false);
                    done();
                }).catch(err => done(err));

            }).catch(err => done(err));
        });

        test('forget about contexts that no longer exist', done => {
            coordinator.handleResponse(response).then(() => {
                eventsEmitted = []; // Reset events

                // Context 7 got removed
                const newResponse: Response = {
                    content: {
                        contexts: [{
                            contextId: 8,
                            contextName: 'eighth context',
                            paused: true,
                        }],
                    },
                    subtype: 'contexts_list',
                    type: 'info',
                };

                coordinator.handleResponse(newResponse).then(() => {
                    assert.equal(eventsEmitted.length, 0);

                    const contexts = coordinator.getAllAvailableContexts();
                    assert.equal(contexts.length, 1);
                    assert.throws(() => { coordinator.getContext(7); }, 'No such context'); // 7 got removed
                    assert.equal(8, coordinator.getContext(8).id); // 8 is still in there
                    done();
                }).catch(err => done(err));

            }).catch(err => done(err));
        });
    });
});
