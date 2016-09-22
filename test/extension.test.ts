import * as assert from 'assert';
import * as vscode from 'vscode';
import { DebugClient } from 'vscode-debugadapter-testsupport';
import { EventEmitter } from 'events';
import { parseResponse, Response, Command } from '../src/protocol';
import { SocketLike, DebugProtocolTransport } from '../src/transport';

suite("debug adapter tests", () => {

    const DEBUG_ADAPTER = './out/src/debugSession.js';

    let debugClient: DebugClient;

    setup(() => {
        debugClient = new DebugClient('node', DEBUG_ADAPTER, 'spidermonkey');
        return debugClient.start();
    });

    teardown(() => debugClient.stop());

    suite("initialize", () => {

        test('should respond with supported features', () => {
            return debugClient.initializeRequest().then(response => {
                assert.equal(response.body.supportsConfigurationDoneRequest, true);
            })
        });
    });
});

suite("transport tests", () => {

    class MockSocket extends EventEmitter implements SocketLike {
        public write(data: Buffer | string, encoding?: string) { }
        public end() { }
        public receive(chunk: string): void {
            this.emit('data', new Buffer(chunk));
        }
    }

    let socket: MockSocket;
    let transport: DebugProtocolTransport;

    setup(() => {
        socket = new MockSocket();
        transport = new DebugProtocolTransport(socket);
    });

    suite("receive one response", () => {

        test("in one chunk", () => {
            transport.on('response', (response: Response) => {
                assert.equal(response.type, 'error');
                assert.equal(response.content.code, 2);
            });
            socket.receive('{"type":"error","code":2,"message":"Unknown JS Context."}\n');
        });

        test("in multiple chunks", () => {
            transport.on('response', (response: Response) => {
                assert.equal(response.type, 'info');
                assert.equal(response.subtype, 'stacktrace');
            });
            socket.receive('1/{"type":"info","subtype":"stacktr');
            socket.receive('ace","stacktrace":[{"url":"/home/bob/script.js","line":1');
            socket.receive('8,"rDepth":0}],"id":"857B3B96591A5163"}\n');
        });
    });

    suite("receive two responses", () => {

        test("in one chunk", () => {
            let responses: Response[] = [];

            transport.on('response', (response: Response) => {
                responses.push(response);
            });
            socket.receive(
                '{"type":"info","subtype":"all_breakpoints_deleted","id":"6DE62B9327DDEFEA"}\n{"type":"error","code":2,"message":"Unknown JS Context."}\n');
            assert.equal(responses.length, 2);
            assert.equal(responses[0].type, 'info');
            assert.equal(responses[1].type, 'error');
        });

        test("in multiple chunks", () => {
            let responses: Response[] = [];

            transport.on('response', (response: Response) => {
                responses.push(response);
            });
            socket.receive('1/{"type":"info","subtype":"stacktr');
            socket.receive('ace","stacktrace":[{"url":"/home/bob/script.js","line":1');
            socket.receive('8,"rDepth":0}],"id":"857B3B96591A5163"}\n{"type":"error","code":2,"message":"Unknown');
            socket.receive(' JS Context."}\n')
            assert.equal(responses.length, 2);
            assert.equal(responses[0].type, 'info');
            assert.equal(responses[0].content.id, '857B3B96591A5163');
            assert.equal(responses[1].type, 'error');
            assert.equal(responses[1].content.message, 'Unknown JS Context.');
        });
    });
});

suite("protocol tests", () => {

    suite("serialize command", () => {
        test("pause", () => {
            let cmd = new Command('pause', 42);
            assert.equal(cmd.toString(), `42/{"name":"pause","type":"command","id":"${cmd.id}"}\n`);
        });

        test("get_all_source_urls", () => {
            let cmd = new Command('get_all_source_urls');
            assert.equal(cmd.toString(), `{"name":"get_all_source_urls","type":"command","id":"${cmd.id}"}\n`);
        });
    });

    suite("parse response", () => {

        test("get_available_contexts", () => {
            const response =
                '{"type":"info","subtype":"contexts_list","contexts":[{"contextId":0,"contextName":"/home/bob/script.js","paused":true}]}\n';
            const result = parseResponse(response);
            assert.equal(result.type, 'info');
            assert.equal(result.subtype, 'contexts_list');
        });

        test("error", () => {
            const response =
                '{"type":"error","code":2,"message":"Unknown JS Context."}\n';
            const result = parseResponse(response);
            assert.equal(result.type, 'error');
            assert.equal(result.content.message, 'Unknown JS Context.');
            assert.equal(result.content.code, 2);
        });

        test("get_stacktrace", () => {
            const response =
                '17/{"type":"info","subtype":"stacktrace","stacktrace":[{"url":"/home/bob/script.js","line":18,"rDepth":0}],"id":"857B3B96591A5163"}\n';
            const result = parseResponse(response);
            assert.equal(result.type, 'info');
            assert.equal(result.subtype, 'stacktrace');
            assert.equal(result.contextId, 17);
            assert.equal(result.content.id, '857B3B96591A5163');
        });
    });
});
