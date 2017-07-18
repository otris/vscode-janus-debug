'use strict';

import * as assert from 'assert';
import { EventEmitter } from 'events';
import { SocketLike } from 'node-sds';
import { cantorPairing, reverseCantorPairing } from '../src/cantor';
import { Command, ErrorCode, parseResponse, Response, variableValueToString } from '../src/protocol';
import { DebugProtocolTransport } from '../src/transport';
import { VariablesContainer, VariablesMap } from '../src/variablesMap';

suite('protocol tests', () => {

    suite('serialize command', () => {
        test('pause', () => {
            const cmd = new Command('pause', 42);
            assert.equal(cmd.toString(), `42/{"name":"pause","type":"command","id":"${cmd.id}"}\n`);
        });

        test('stop', () => {
            const cmd = new Command('stop', 24);
            assert.equal(cmd.toString(), `24/{"name":"stop","type":"command"}\n`);
        });

        test('next', () => {
            const cmd = new Command('next', 11);
            assert.equal(cmd.toString(), `11/{"name":"next","type":"command"}\n`);
        });

        test('get_all_source_urls', () => {
            const cmd = new Command('get_all_source_urls');
            assert.equal(cmd.toString(), `{"name":"get_all_source_urls","type":"command","id":"${cmd.id}"}\n`);
        });

        test('get_source', () => {
            const cmd = Command.getSource('fubar.js');
            assert.equal(cmd.toString(), `{"name":"get_source","type":"command","id":"${cmd.id}","url":"fubar.js"}\n`);
        });

        test('evaluate', () => {
            const cmd = Command.evaluate(42, {
                path: "toString",
                options: {
                    "show-hierarchy": true,
                    "evaluation-depth": 1
                }
            });

            assert.equal(cmd.toString(), `42/{"name":"evaluate","type":"command","id":"${cmd.id}","path":"toString","options":{"show-hierarchy":true,"evaluation-depth":1}}\n`);
        });

        test('step_out', () => {
            const cmd = new Command('step_out');
            assert.equal(cmd.toString(), `{"name":"step_out","type":"command","id":"${cmd.id}"}\n`);
        });

        suite('set_breakpoint', () => {

            test('with pending === false', () => {
                const cmd = Command.setBreakpoint('fubar.js', 17, false);
                assert.equal(cmd.toString(),
                    `{"name":"set_breakpoint","type":"command","id":"${cmd.id}",\
"breakpoint":{"line":17,"pending":false,"url":"fubar.js"}}\n`);
            });

            test('with pending === true', () => {
                const cmd = Command.setBreakpoint('script.js', 1);
                assert.equal(cmd.toString(),
                    `{"name":"set_breakpoint","type":"command","id":"${cmd.id}",\
"breakpoint":{"line":1,"pending":true,"url":"script.js"}}\n`);
            });

            test('with optional context id', () => {
                const cmd = Command.setBreakpoint('script.js', 42, true, 11);
                assert.equal(cmd.toString(),
                    `11/{"name":"set_breakpoint","type":"command","id":"${cmd.id}",\
"breakpoint":{"line":42,"pending":true,"url":"script.js"}}\n`);
            });
        });

        test('get_available_contexts', () => {
            const cmd = new Command('get_available_contexts');
            assert.equal(`get_available_contexts\n`, cmd.toString());
        });

        test('delete_all_breakpoints', () => {
            const cmd = new Command('delete_all_breakpoints');
            assert.equal(cmd.toString(), `{"name":"delete_all_breakpoints","type":"command","id":"${cmd.id}"}\n`);
        });

        test('exit', () => {
            const cmd = new Command('exit');
            assert.equal(cmd.toString(), `exit\n`);
        });

        test('get_variables', () => {
            const cmd = Command.getVariables(16, {
                depth: 0,
                options: {
                    'evaluation-depth': 1,
                    'show-hierarchy': true,
                },
            });
            assert.equal(cmd.toString(),
                `16/{"name":"get_variables","type":"command","id":"${cmd.id}",\
"query":{"depth":0,"options":{"evaluation-depth":1,"show-hierarchy":true}}}\n`);
        });

        suite('continue', () => {

            test('all contexts', () => {

                const cmd = new Command('continue');
                assert.equal(cmd.toString(), `{"type":"command","name":"continue"}\n`);
            });

            test('a single context', () => {
                const cmd = new Command('continue', 5);
                assert.equal(cmd.toString(), `5/{"name":"continue","type":"command","id":"${cmd.id}"}\n`);
            });
        });
    });

    suite('parse response', () => {

        suite('type: error', () => {

            test('NO_COMMAND_NAME', () => {
                const response =
                    '{"type":"error","code":2,"message":"Unknown JS Context."}\n';
                const result = parseResponse(response);
                assert.equal(result.type, 'error');
                assert.equal(result.content.message, 'Unknown JS Context.');
                assert.equal(result.content.code, ErrorCode.NO_COMMAND_NAME);
            });
        });

        suite('type: info', () => {

            test('contexts_list', () => {
                const response =
                    '{"type":"info","subtype":"contexts_list","contexts":\
[{"contextId":0,"contextName":"/home/bob/script.js","paused":true}]}\n';
                const result = parseResponse(response);
                assert.equal(result.type, 'info');
                assert.equal(result.subtype, 'contexts_list');
            });

            test('stacktrace', () => {
                const response =
                    '17/{"type":"info","subtype":"stacktrace","stacktrace":\
[{"url":"/home/bob/script.js","line":18,"rDepth":0}],"id":"857B3B96591A5163"}\n';
                const result = parseResponse(response);
                assert.equal(result.type, 'info');
                assert.equal(result.subtype, 'stacktrace');
                assert.equal(result.contextId, 17);
                assert.equal(result.content.id, '857B3B96591A5163');
            });

            test('variables', () => {
                const response =
                    '13/{"type":"info","subtype":"variables",\
"variables":[{"stackElement":{"url":"Some script","line":23,"rDepth":0},"variables":[\
{"name":"sleep","value":{"___jsrdbg_function_desc___":{"displayName":"sleep","name":"sleep",\
"parameterNames":["millis"]},"prototype":{"___jsrdbg_collapsed___":true},"length":1,"name":"sleep",\
"arguments":null,"caller":null}},\
{"name":"log","value":{"___jsrdbg_function_desc___":{"displayName":"log","name":"log",\
"parameterNames":["msg"]},"prototype":{"___jsrdbg_collapsed___":true},"length":1,"name":"log",\
"arguments":null,"caller":null}},\
{"name":"i","value":0},{"name":"arguments","value":{"length":0,"callee":{"___jsrdbg_collapsed___":true}}}]}],\
"id":"63DFE5D533FD5EB4"}\n';
                const result = parseResponse(response);
                assert.equal(result.type, 'info');
                assert.equal(result.subtype, 'variables');
                assert.equal(result.contextId, 13);
                assert.equal(result.content.variables.length, 1);
            });

            test('source_code', () => {
                const response =
                    '{"type":"info","subtype":"source_code","script":"fubar.js","source":\
["debugger;","var i = 42;"],"displacement":0,"id":"857B3B96591A5163"}';
                const result = parseResponse(response);
                assert.equal(result.type, 'info');
                assert.equal(result.subtype, 'source_code');
                assert.equal(result.contextId, undefined);
                assert.equal(result.content.script, 'fubar.js');
                assert.equal(result.content.source.length, 2);
                assert.equal(result.content.source[0], 'debugger;');
                assert.equal(result.content.source[1], 'var i = 42;');
            });

            test('evaluate', () => {
                const response = '{"type":"info","subtype":"evaluated","result":"666","id":"e07bc71f-4169-464a-9adf-f6c75d1643ca"}';
                const result = parseResponse(response);
                assert.equal(result.type, 'info');
                assert.equal(result.subtype, 'evaluated');
                assert.equal(result.content.result, '666');
                assert.equal(result.content.id, 'e07bc71f-4169-464a-9adf-f6c75d1643ca');
            });
        });
    });

    suite('variableValueToString', () => {

        test('value is undefined', () => {
            assert.equal(variableValueToString(
                '___jsrdbg_undefined___'),
                'undefined');
        });

        test('value is a number', () => {
            assert.equal(variableValueToString(
                '42'),
                '42');
        });

        test('value is an empty array', () => {
            assert.equal(variableValueToString(
                { length: 0, callee: { ___jsrdbg_collapsed___: true } }),
                'Array[0] []');
        });

        test('value is a function', () => {
            assert.equal(variableValueToString(
                {
                    ___jsrdbg_function_desc___: {
                        displayName: 'log',
                        name: 'log',
                        parameterNames: ['msg'],
                    },
                    arguments: null,
                    caller: null,
                    length: 1,
                    name: 'log',
                    prototype: {
                        ___jsrdbg_collapsed___: true,
                    },
                }),
                'function (msg) { … }');
        });
    });
});
