'use strict';

import * as assert from 'assert';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import { Hash } from '../src/cryptmd5';
import { SocketLike } from '../src/network';
import { Message, ParameterName, Response, SDSConnection, SDSProtocolTransport } from '../src/sds';

suite('SDS protocol tests', () => {

    suite('parse response', () => {

        test('successful ChangeUser', () => {
            const bytes = [
                0x00, 0x00, 0x00, 0x4f, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x05, 0xff,
                0xff, 0xff, 0xdc, 0x07, 0x15, 0x00, 0x00, 0x00,
                0x0d, 0x50, 0x65, 0x74, 0x65, 0x72, 0x20, 0x53,
                0x63, 0x68, 0x75, 0x74, 0x7a, 0x00, 0x03, 0x28,
                0x00, 0x00, 0x00, 0x01, 0x07, 0x16, 0x00, 0x00,
                0x00, 0x1d, 0x24, 0x31, 0x24, 0x6f, 0x33, 0x24,
                0x41, 0x2e, 0x75, 0x66, 0x6d, 0x63, 0x48, 0x36,
                0x45, 0x41, 0x37, 0x31, 0x73, 0x45, 0x44, 0x72,
                0x68, 0x2e, 0x55, 0x58, 0x6e, 0x2e, 0x00,
            ];
            const res = new Response(Buffer.from(bytes));
            assert.equal(79, res.length);
            assert.equal(-36, res.getInt32(ParameterName.ReturnValue));
            assert.equal('Peter Schutz', res.getString(ParameterName.User));
            assert.equal(1, res.getInt32(ParameterName.UserId));
            assert.equal('$1$o3$A.ufmcH6EA71sEDrh.UXn.', res.getString(ParameterName.Password));
        });

        test('successful RunScriptOnServer', () => {
            const bytes = [
                0x00, 0x00, 0x00, 0x23, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x05, 0x07,
                0x30, 0x00, 0x00, 0x00, 0x0e, 0x48, 0x65, 0x6c,
                0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c,
                0x64, 0x21, 0x00,
            ];
            const res = new Response(Buffer.from(bytes));
            assert.equal(35, res.length);
            assert.equal(true, res.getBool(ParameterName.ReturnValue));
            assert.equal('Hello, world!', res.getString(ParameterName.Parameter));
        });

        test('get parameter throws when response is simple', () => {
            const bytes = [0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01];
            const res = new Response(Buffer.from(bytes));
            assert.ok(res.isSimple());
            assert.throws(() => { res.getInt32(ParameterName.ReturnValue); }, 'simple response cannot have a parameter');
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

        test('create Hello message', done => {
            connection.send(Message.hello()).then(() => {
                assert.equal(1, socket.out.length);
                let packet = socket.out[0];
                assert.equal(8, packet.length);
                done();
            }).catch(err => done(err));
        });

        test('create DisconnectClient message', done => {
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

        test('create ChangeUser message', done => {
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

        test('create ErrorMessage message', done => {
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
