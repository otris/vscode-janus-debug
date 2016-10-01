import * as assert from 'assert';
import * as vscode from 'vscode';
import { DebugClient } from 'vscode-debugadapter-testsupport';
import { EventEmitter } from 'events';
import { parseResponse, Response, Command } from '../src/protocol';
import { SocketLike, DebugProtocolTransport } from '../src/transport';
import { SourceMap } from '../src/sourceMap';
import { cantorPairing, reverseCantorPairing } from '../src/cantor';

suite("source map tests", () => {

    suite("remoteSourceUrl", () => {

        let sourceMap: SourceMap;

        setup(() => {
            sourceMap = new SourceMap();
            sourceMap.setAllRemoteUrls([
                '/usr/lib/fubar/script1.js',
                '/usr/lib/fubar/extension/script2.js',
                '/usr/lib/fubar/extension/script3.js',
                '/usr/lib/fubar/script4.js',
            ]);
        });

        test("different urls on localhost and target", () => {
            let result = sourceMap.remoteSourceUrl('/Users/bob/fubar/src/server/script1.js');
            assert.equal(result, '/usr/lib/fubar/script1.js');
        });

        test("fallback to local url", () => {
            let result = sourceMap.remoteSourceUrl('/Users/bob/fubar/bielefeld.js');
            assert.equal(result, '/Users/bob/fubar/bielefeld.js')
        });
    });
});

suite("debug adapter tests", () => {

    const DEBUG_ADAPTER = './out/src/debugSession.js';

    let debugClient: DebugClient;

    setup(() => {
        debugClient = new DebugClient('node', DEBUG_ADAPTER, 'janus');
        return debugClient.start();
    });

    teardown(() => debugClient.stop());

    suite("initialize", () => {

        test('should respond with supported features', () => {
            return debugClient.initializeRequest().then(response => {
                let body = response.body || {};
                assert.equal(body.supportsConfigurationDoneRequest, true);
                assert.equal(body.supportsConditionalBreakpoints, false);
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

        test("set_breakpoint pending === false", () => {
            let cmd = Command.setBreakpoint('fubar.js', 17, false);
            assert.equal(cmd.toString(),
                `{"name":"set_breakpoint","type":"command","id":"${cmd.id}","breakpoint":{"url":"fubar.js","line":17,"pending":false}}\n`);
        });

        test("set_breakpoint pending === true", () => {
            let cmd = Command.setBreakpoint('script.js', 1);
            assert.equal(cmd.toString(),
                `{"name":"set_breakpoint","type":"command","id":"${cmd.id}","breakpoint":{"url":"script.js","line":1,"pending":true}}\n`);
        });

        test("get_available_contexts", () => {
            let cmd = new Command('get_available_contexts');
            assert.equal(`get_available_contexts\n`, cmd.toString());
        });

        test("delete_all_breakpoints", () => {
            let cmd = new Command('delete_all_breakpoints');
            assert.equal(cmd.toString(), `{"name":"delete_all_breakpoints","type":"command","id":"${cmd.id}"}\n`);
        });
    });

    suite("parse response", () => {

        test("contexts_list", () => {
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

        test("stacktrace", () => {
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

suite("cantor", () => {

    test("pairing", () => {
        assert.equal(cantorPairing(47, 32), 3192);
    });

    test("reverse pairing", () => {
        let result = reverseCantorPairing(1432);
        assert.equal(result.x, 52);
        assert.equal(result.y, 1);
    });
});