import * as assert from 'assert';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import { SDSConnection, SDSProtocolTransport } from '../src/sds';
import { htonl, ntohl, SocketLike } from '../src/network';

suite('SDS protocol tests', () => {

    suite('byte order', () => {

        test('network to host byte order of 0', () => {
            assert.equal(0, ntohl(Buffer.from([0, 0, 0, 0]), 0));
        });

        test('host to network byte order of 0', () => {
            let buf = Buffer.from([0, 0, 0, 0]);
            htonl(buf, 0, 0);
            assert.equal(0, buf[0]);
            assert.equal(0, buf[1]);
            assert.equal(0, buf[2]);
            assert.equal(0, buf[3]);
        });

        test('byte order round trip', () => {
            // 1729: [ c1 06 00 00 ] in host byte order (little-endian)
            //       [ 00 00 06 c1 ] in network byte order (big-endian)
            let bytes = Buffer.from([0, 0, 0, 0]);
            htonl(bytes, 0, 1729);
            assert.equal(0, bytes[0]);
            assert.equal(0, bytes[1]);
            assert.equal(6, bytes[2]);
            assert.equal(193, bytes[3]);

            assert.equal(1729, ntohl(bytes, 0));
        });
    });

    suite('connection tests', () => {

        class MockSocket extends EventEmitter implements SocketLike {
            public written: Buffer[] = [];

            public write(data: any, encoding?: string) {
                this.written.push(data);
            }
            public end() {/* */ }
            public receive(chunk: number[]): void {
                this.emit('data', Buffer.from(chunk));
            }
        }

        let socket: MockSocket;
        let connection: SDSConnection;

        setup(() => {
            socket = new MockSocket();
            connection = new SDSConnection(socket);
        });

        teardown(() => {
            connection.disconnect();
        });

        test('establishing a new connection', () => {
            connection.connect().then(() => {
                assert.equal(1, socket.written.length);
                assert.equal(8, socket.written[0].length, 'a "Hello" is 8 bytes long');

                socket.receive([]);
            });
        });
    });
});
