import * as assert from 'assert';
import * as vscode from 'vscode';
import { DebugClient } from 'vscode-debugadapter-testsupport';
import { EventEmitter } from 'events';
import { parseResponse, Response, Command, ErrorCode } from '../src/protocol';
import { SocketLike, DebugProtocolTransport } from '../src/transport';
import { SourceMap } from '../src/sourceMap';
import { cantorPairing, reverseCantorPairing } from '../src/cantor';
import { ConnectionLike } from '../src/connection';
import { ContextCoordinator } from '../src/context';

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
            assert.equal(result, '/Users/bob/fubar/bielefeld.js');
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

        test("should respond with supported features", () => {
            return debugClient.initializeRequest().then(response => {
                let body = response.body || {};
                assert.equal(body.supportsConfigurationDoneRequest, true);
                assert.equal(body.supportsConditionalBreakpoints, false);
            });
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
            socket.receive(' JS Context."}\n');
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
        test("'pause'", () => {
            let cmd = new Command('pause', 42);
            assert.equal(cmd.toString(), `42/{"name":"pause","type":"command","id":"${cmd.id}"}\n`);
        });

        test("'next'", () => {
            let cmd = new Command('next', 1);
            assert.equal(cmd.toString(), `1/{"name":"next","type":"command"}\n`);
        });

        test("'get_all_source_urls'", () => {
            let cmd = new Command('get_all_source_urls');
            assert.equal(cmd.toString(), `{"name":"get_all_source_urls","type":"command","id":"${cmd.id}"}\n`);
        });

        test("'get_source'", () => {
            let cmd = Command.getSource('fubar.js');
            assert.equal(cmd.toString(), `{"name":"get_source","type":"command","id":"${cmd.id}","url":"fubar.js"}\n`);
        });

        suite("'set_breakpoint'", () => {

            test("with pending === false", () => {
                let cmd = Command.setBreakpoint('fubar.js', 17, false);
                assert.equal(cmd.toString(),
                    `{"name":"set_breakpoint","type":"command","id":"${cmd.id}","breakpoint":{"url":"fubar.js","line":17,"pending":false}}\n`);
            });

            test("with pending === true", () => {
                let cmd = Command.setBreakpoint('script.js', 1);
                assert.equal(cmd.toString(),
                    `{"name":"set_breakpoint","type":"command","id":"${cmd.id}","breakpoint":{"url":"script.js","line":1,"pending":true}}\n`);
            });
        });

        test("'get_available_contexts'", () => {
            let cmd = new Command('get_available_contexts');
            assert.equal(`get_available_contexts\n`, cmd.toString());
        });

        test("'delete_all_breakpoints'", () => {
            let cmd = new Command('delete_all_breakpoints');
            assert.equal(cmd.toString(), `{"name":"delete_all_breakpoints","type":"command","id":"${cmd.id}"}\n`);
        });

        test("'exit'", () => {
            let cmd = new Command('exit');
            assert.equal(cmd.toString(), `exit\n`);
        });

        test("'get_variables'", () => {
            let cmd = Command.getVariables(16, {
                depth: 0,
                options: {
                    "show-hierarchy": true,
                    "evaluation-depth": 1
                }
            });
            assert.equal(cmd.toString(),
                `16/{"name":"get_variables","type":"command","id":"${cmd.id}","query":{"depth":0,"options":{"show-hierarchy":true,"evaluation-depth":1}}}\n`);
        });

        suite("'continue'", () => {

            test("all contexts", () => {

                let cmd = new Command('continue');
                assert.equal(cmd.toString(), `{"type":"command","name":"continue"}\n`);
            });

            test("a single context", () => {
                let cmd = new Command('continue', 5);
                assert.equal(cmd.toString(), `5/{"name":"continue","type":"command","id":"${cmd.id}"}\n`);
            });
        });
    });

    suite("parse response", () => {

        suite("type: 'error'", () => {

            test("NO_COMMAND_NAME", () => {
                const response =
                    '{"type":"error","code":2,"message":"Unknown JS Context."}\n';
                const result = parseResponse(response);
                assert.equal(result.type, 'error');
                assert.equal(result.content.message, 'Unknown JS Context.');
                assert.equal(result.content.code, ErrorCode.NO_COMMAND_NAME);
            });
        });

        suite("type: 'info'", () => {

            test("contexts_list", () => {
                const response =
                    '{"type":"info","subtype":"contexts_list","contexts":[{"contextId":0,"contextName":"/home/bob/script.js","paused":true}]}\n';
                const result = parseResponse(response);
                assert.equal(result.type, 'info');
                assert.equal(result.subtype, 'contexts_list');
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

            test("variables", () => {
                const response =
                    '13/{"type":"info","subtype":"variables","variables":[{"stackElement":{"url":"Some script","line":23,"rDepth":0},"variables":[{"name":"sleep","value":{"___jsrdbg_function_desc___":{"displayName":"sleep","name":"sleep","parameterNames":["millis"]},"prototype":{"___jsrdbg_collapsed___":true},"length":1,"name":"sleep","arguments":null,"caller":null}},{"name":"log","value":{"___jsrdbg_function_desc___":{"displayName":"log","name":"log","parameterNames":["msg"]},"prototype":{"___jsrdbg_collapsed___":true},"length":1,"name":"log","arguments":null,"caller":null}},{"name":"i","value":0},{"name":"arguments","value":{"length":0,"callee":{"___jsrdbg_collapsed___":true}}}]}],"id":"63DFE5D533FD5EB4"}\n';
                const result = parseResponse(response);
                assert.equal(result.type, 'info');
                assert.equal(result.subtype, 'variables');
                assert.equal(result.contextId, 13);
                assert.equal(result.content.variables.length, 1);
            });

            test("source_code", () => {
                const response =
                    '{"type":"info","subtype":"source_code","script":"fubar.js","source":["debugger;","var i = 42;"],"displacement":0,"id":"857B3B96591A5163"}';
                const result = parseResponse(response);
                assert.equal(result.type, 'info');
                assert.equal(result.subtype, 'source_code');
                assert.equal(result.contextId, undefined);
                assert.equal(result.content.script, 'fubar.js');
                assert.equal(result.content.source.length, 2);
                assert.equal(result.content.source[0], 'debugger;');
                assert.equal(result.content.source[1], 'var i = 42;');
            });
        });
    });
});

suite("cantor algorithm tests", () => {

    test("pairing", () => {
        assert.equal(cantorPairing(47, 32), 3192);
    });

    test("reverse pairing", () => {
        let result = reverseCantorPairing(1432);
        assert.equal(result.x, 52);
        assert.equal(result.y, 1);
    });
});

suite("context coordinator coordinates requests and responses", () => {

    class MockConnection extends EventEmitter implements ConnectionLike {
        public sendRequest(request: Command, responseHandler?: (response: Response) => Promise<any>): Promise<any> {
            return Promise.resolve();
        }

        public handleResponse(response: Response): void {

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
        mockConnection.on('newContext', (contextId, contextName, stopped) => {
            eventsEmitted.push({ contextId, contextName, stopped });
        });
    });

    teardown(() => {
        eventsEmitted = [];
    });

    test("has no contexts after construction", () => {
        assert.equal(coordinator.getAllAvailableContexts().length, 0);
        assert.throws(() => { coordinator.getContext(23); }, "No such context");
    });

    suite("a 'contexts_list' response should...", () => {

        let response: Response = {
            type: 'info',
            content: {
                contexts: [{
                    contextId: 7,
                    contextName: 'seventh context',
                    paused: false
                },
                {
                    contextId: 8,
                    contextName: 'eighth context',
                    paused: true
                }]
            },
            subtype: 'contexts_list'
        };

        test("remember all contexts in the response", () => {
            coordinator.handleResponse(response).then(() => {
                let contexts = coordinator.getAllAvailableContexts();

                assert.equal(contexts.length, 2);
                assert.throws(() => { coordinator.getContext(23); }, "No such context");

                let context = coordinator.getContext(7);
                assert.equal(context.id, 7);
                assert.equal(context.name, 'seventh context');
                assert.equal(context.isStopped(), false);

                context = coordinator.getContext(8);
                assert.equal(context.id, 8);
                assert.equal(context.name, 'eighth context');
                assert.equal(context.isStopped(), true);
            });
        });

        test("emit a 'newContext' event as soon a new context is found", () => {
            coordinator.handleResponse(response).then(() => {
                assert.equal(eventsEmitted.length, 2);
            });
        });

        test("emit a 'newContext' event only for unknown contexts", () => {
            coordinator.handleResponse(response).then(() => {
                let newResponse = response;
                newResponse.content.contexts.push({
                    contextId: 9,
                    contextName: 'ninth context',
                    paused: false
                });
                eventsEmitted = [];
                coordinator.handleResponse(newResponse).then(() => {
                    assert.equal(eventsEmitted.length, 1);
                    assert.equal(eventsEmitted[0].contextId, 9);
                    assert.equal(eventsEmitted[0].contextName, 'ninth context');
                    assert.equal(eventsEmitted[0].paused, false);
                });
            });
        });

        test("forget about contexts that no longer exist", () => {
            let eventsEmitted: any[] = [];
            let newResponse: Response = {
                type: 'info',
                content: {
                    contexts: [{
                        contextId: 8,
                        contextName: 'eighth context',
                        paused: true
                    }]
                },
                subtype: 'contexts_list'
            };
            coordinator.handleResponse(response).then(() => {
                assert.equal(eventsEmitted.length, 0);

                let contexts = coordinator.getAllAvailableContexts();
                assert.equal(contexts.length, 1);
                assert.throws(() => { coordinator.getContext(7); }, "No such context");
            });
        });
    });
});