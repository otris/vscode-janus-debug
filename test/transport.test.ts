import * as assert from 'assert';
import { EventEmitter } from 'events';
import { SocketLike } from 'node-sds';
import { Command, ErrorCode, parseResponse, Response, variableValueToString } from '../src/protocol';
import { DebugProtocolTransport } from '../src/transport';

suite('transport tests', () => {

    class MockSocket extends EventEmitter implements SocketLike {
        public write(data: Buffer | string, encoding?: string): boolean { return true; }
        public end(): void { /* */ }
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

    suite('receive one response', () => {

        test('in one chunk', () => {
            transport.on('response', (response: Response) => {
                assert.equal(response.type, 'error');
                assert.equal(response.content.code, 2);
            });
            socket.receive('{"type":"error","code":2,"message":"Unknown JS Context."}\n');
        });

        test('in multiple chunks', () => {
            transport.on('response', (response: Response) => {
                assert.equal(response.type, 'info');
                assert.equal(response.subtype, 'stacktrace');
            });
            socket.receive('1/{"type":"info","subtype":"stacktr');
            socket.receive('ace","stacktrace":[{"url":"/home/bob/script.js","line":1');
            socket.receive('8,"rDepth":0}],"id":"857B3B96591A5163"}\n');
        });
    });

    suite('receive two responses', () => {

        test('in one chunk', () => {
            const responses: Response[] = [];

            transport.on('response', (response: Response) => {
                responses.push(response);
            });
            socket.receive(
                '{"type":"info","subtype":"all_breakpoints_deleted","id":"6DE62B9327DDEFEA"}\n\
                {"type":"error","code":2,"message":"Unknown JS Context."}\n');
            assert.equal(responses.length, 2);
            assert.equal(responses[0].type, 'info');
            assert.equal(responses[1].type, 'error');
        });

        test('in multiple chunks', () => {
            const responses: Response[] = [];

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
