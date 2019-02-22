import * as assert from 'assert';
import { EventEmitter } from 'events';
import { SocketLike } from 'node-sds';
import { DebugClient } from 'vscode-debugadapter-testsupport';

suite('debug Session', () => {

    suite('debug adapter tests', () => {

        class MockSocket extends EventEmitter implements SocketLike {
            public write(data: Buffer | string, encoding?: string): boolean { return true; }
            public end(): void { /* */ }
            public receive(chunk: string): void {
                this.emit('data', new Buffer(chunk));
            }
        }

        const DEBUG_ADAPTER = './out/src/debugSession.js';
        let debugClient: DebugClient;
        let socket: MockSocket;

        setup(() => {
            socket = new MockSocket();
            debugClient = new DebugClient('node', DEBUG_ADAPTER, 'janus');
            return debugClient.start();
        });

        teardown(() => debugClient.stop());

        suite('basic functionality', () => {

            test('initialize: should respond with supported features', done => {
                debugClient.initializeRequest().then((response) => {
                    const body = response.body || {};
                    assert.equal(body.supportsConfigurationDoneRequest, true);
                    assert.equal(body.supportsConditionalBreakpoints, false);
                    done();
                }).catch(err => done(err));
            });

            test('disconnect: should return true', async () => {
                const response = await debugClient.disconnectRequest();
                assert.equal(response.command, 'disconnect');
                assert.equal(response.success, true);
            });
        });
    });
});
