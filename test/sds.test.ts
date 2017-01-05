import * as assert from 'assert';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import { Hash } from '../src/cryptmd5';
import { htonl, ntohl, SocketLike } from '../src/network';
import { Message, Response, SDSConnection, SDSProtocolTransport } from '../src/sds';

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
            public out: Buffer[] = [];

            public write(data: any, encoding?: string) {
                this.out.push(data);
                this.emit('data', Buffer.from([]));
            }
            public end() { /* */ }
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

        test('hello message', done => {
            connection.send(Message.hello()).then(() => {
                assert.equal(1, socket.out.length);
                let packet = socket.out[0];
                assert.equal(8, packet.length);
                done();
            }).catch(err => done(err));
        });

        test('disconnectClient message', done => {
            connection.send(Message.disconnectClient()).then(() => {
                assert.equal(1, socket.out.length);
                let packet = socket.out[0];
                assert.equal(13, packet.length);
                const bytes = [
                    0x00, 0x00, 0x00, 0x0d, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0x31,
                ];
                assert.ok(packet.equals(Buffer.from(bytes)));
                done();
            }).catch(err => done(err));
        });

        test('changeUser message', done => {
            const username: string = 'admin';
            const password: Hash = function () { let h = new Hash(''); h.value = 'secret'; return h; } ();

            connection.send(Message.changeUser(username, password)).then(() => {
                assert.equal(1, socket.out.length);
                let packet = socket.out[0];
                assert.equal(38, packet.length);
                const bytes = [
                    0x00, 0x00, 0x00, 0x26, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0x1b, 0x07, 0x15, 0x00,
                    0x00, 0x00, 0x06, 0x61, 0x64, 0x6d, 0x69, 0x6e,
                    0x00, 0x07, 0x16, 0x00, 0x00, 0x00, 0x07, 0x73,
                    0x65, 0x63, 0x72, 0x65, 0x74, 0x00,
                ];
                assert.ok(packet.equals(Buffer.from(bytes)));

                done();
            }).catch(err => done(err));
        });

        test('getErrorMessage message', done => {
            const errorCode = 21;

            connection.send(Message.errorMessage(errorCode)).then(() => {
                assert.equal(1, socket.out.length);
                const packet = socket.out[0];
                assert.equal(25, packet.length);
                const bytes = [
                    0x00, 0x00, 0x00, 0x19, 0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00, 0xc7, 0x03, 0x0d, 0x00,
                    0x00, 0x00, 0x11, 0x03, 0x04, 0x00, 0x00, 0x00,
                    0x15,
                ];
                assert.ok(packet.equals(Buffer.from(bytes)));
                done();

            }).catch(err => done(err));
        });

        suite('establish a new connection', () => {

            test('server refused connection', done => {

                socket.write = (data: any, encoding?: string) => {
                    socket.out.push(data);
                    socket.emit('data', Buffer.from('invalid', 'ascii'));
                };

                connection.connect().then(() => {
                    done(new Error('expected exception to be thrown'));
                }).catch(err => {
                    assert.equal('Error: server refused connection', err);
                    done();
                });
            });
        });
    });
});
