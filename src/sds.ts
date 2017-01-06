/*
   SDS (or SDS2) is a synchronous binary application-layer protocol on top of TCP that "real" JANUS clients use to speak
   to JANUS servers. I could not find any document describing the protocol but there is a C++ library that you can use
   to "reverse-engineer" the protocol (You'll find it under `src/janus/2.9.6/srvclnt`) plus you can always analyze the
   TCP stream with Wireshark. The protocol is one of those historic mistakes that never got fixed.


   Layout of a Typical Message

   The protocol seems to be modeled with RPC in mind. You have operations that are invoked with a single message that is
   send to the server along with a bunch of parameters. The response usually contains the return value of that
   operation.

    ╔═════ > Message Head
    ║ 0
    ║ 1  First 4-bytes are the length of the entire message in network byte order, including the length itself. It seems
    ║ 2  that it is possible to bit-wise OR some flags in here, but we do not do this.
    ║ 3
    ╠══
    ║ 0
    ║ 1
    ║ 2
    ║ 3  These 8 bytes are reserved for a 64-bit data structure called OID. An OID is a unique identifier (application
    ║ 4  wide, I guess) that identifies a single object. Rarely used here. Most of the times these are just 0-bytes.
    ║ 5
    ║ 6
    ║ 7
    ╠══
    ║ 0  The last byte of the message head encodes the operation used. See enum below.
    ╚══
    ╔══
    ║ 0  First byte of this block is the type of this parameter. See enum below.
    ╠══
    ║ 1  Second byte is the parameter name. See enum below.
    ╠══
    ║ 2
    ║ 3
    ║ 4  The remainder is the actual data of the parameter. This data block is of variable length, depending on the
    ║ 5  parameter type.
    ║ 6
    ║ 7
    ║ .
    ║ .
    ║ .
    ╚═════ > Message parameter

   Each message possibly consists of multiple parameters. There must be at least one, I think.

   There are also "simple" messages. Simple messages have no message parameters and consist solely of the message head,
   actually just the first four bytes of it (thus are 8-bytes in total). Simple messages are also not used here.


   Saying "Hello" in SDS

   Precondition: TCP connection established. A SDS connection is "established" after following sequence of messages got
   exchanged.

   1. We send a short "Hello"-like message.
   2. The server acknowledges this message with a short response, possibly negotiating SSL terms.
   3. We introduce ourselves by sending a short string containing our client's name.
   4. The server responds with a client ID that we store.

   After that it seems that we can do pretty much what we like.

   The "Hello"-like message consists of a 8-byte buffer whereas the first four bytes can be picked at random and the
   last four bytes are a crypt(3) with MD5 variation encrypted of the first 4 bytes. We don't bother and always send the
   same 8 bytes.

   The client ID can be used to track this connection in the server's log files later on. I presume this client ID is
   solely useful for logging and debugging purposes. A connection is closed simply by ending the TCP connection (by
   sending a FIN packet). The server usually notes this as a "client crashed" event in the log files. However, every
   existing client seems to do it this way. You can use the disconnect() method for this.

*/

'use strict';

import * as assert from 'assert';
import { EventEmitter } from 'events';
import { connect } from 'net';
import * as os from 'os';
import * as cryptmd5 from './cryptmd5';
import { Logger } from './log';
import { htonl, ntohl, SocketLike } from './network';

const HELLO: Buffer = Buffer.from('GGCH$1$$', 'ascii');
const ACK: Buffer = Buffer.from(term('valid'));
const INITIAL_BUFFER_SIZE = 4 * 1024;
const FIRST_PARAM_INDEX = 13;

/**
 * Return an array of all UTF-16 code units in given string plus a 0-terminus.
 *
 * Hint: The result looks pretty much like a C-style string.
 * @param {string} str An arbitrary string
 * @returns An array containing all code units plus a final '0'.
 */
function term(str: string): number[] {
    let units = str.split('').map(char => { return char.charCodeAt(0); });
    units.push(0);
    return units;
}

/**
 * Return a string where all bytes in given Buffer object are printed conveniently in hexadecimal notation. Only useful
 * when logging or debugging.
 *
 * @param {string} msg A string that is printed as prefix
 * @param {Buffer} buf The buffer to print
 * @returns A string with given buffer's contents in hexadecimal notation.
 */
function printBytes(msg: string | undefined, buf: Buffer): string {
    let str = `${buf.length}: [\n`;
    if (msg !== undefined) {
        str = `${msg} ` + str;
    }
    let column = 0;
    let i = 0;
    for (; i < buf.length; i++) {
        if (column === 8) {
            column = 0;
            str += `\n`;
        }
        column++;
        let hex: string = buf[i].toString(16);
        str += (hex.length === 1 ? '0x0' + hex : '0x' + hex) + ', ';
    }
    str += `\n]`;
    return str;
}

enum Operation {
    ChangeUser = 27,
    DisconnectClient = 49,
    COMOperation = 199,
}

enum COMOperation {
    ErrorMessage = 17,
}

enum Parameter {
    ClientId = 1,
    Value = 4,
    ReturnValue = 5,
    Index = 13,
    User = 21,
    Password = 22,
    UserId = 40,
}

enum Type {
    Boolean = 2,
    Int32 = 3,
    Date = 4,
    String = 7,
    OID = 9,
    Int32List = 10,
    StringList = 11,
    OIDList = 12,
    NullFlag = 128,
}

export class Message {
    /**
     * Create an arbitrary message from the given buffer.
     */
    public static from(buf: Buffer): Message {
        let msg = new Message();
        msg.buffer = buf;
        msg.bufferedLength = buf.length;
        return msg;
    }

    /**
     * Create a "Hello"" message.
     *
     * This is the very first message send to the server.
     */
    public static hello(): Message {
        let msg = Message.from(HELLO);
        msg.pack = (): Buffer => {
            return msg.buffer;
        };
        return msg;
    }

    /**
     * Create a "DisconnectClient" message.
     *
     * This message disconnects the client from the server in an orderly fashion.
     */
    public static disconnectClient(): Message {
        let msg = new Message();
        msg.add([0, 0, 0, 0, 0, 0, 0, 0, Operation.DisconnectClient]);
        return msg;
    }

    /**
     * Create a "ErrorMessage" message.
     *
     * This message returns a human-readable string (probably in German) for a given error code.
     * @param {number} errorCode The error code from a previous SDS call.
     */
    public static errorMessage(errorCode: number): Message {
        let msg = new Message();
        msg.add([0, 0, 0, 0, 0, 0, 0, 0, Operation.COMOperation]);
        msg.addInt32(Parameter.Index, COMOperation.ErrorMessage);
        msg.addInt32(Parameter.Value, errorCode);
        return msg;
    }

    /**
     * Create a "ChangeUser" message.
     *
     * This message logs in the given user.
     *
     * @param {string} username The user to login. Can be with principal name (e.g., 'duckburg.mickey').
     * @param {Hash} password The user's password hashed with crypt_md5.
     */
    public static changeUser(username: string, password: cryptmd5.Hash): Message {
        let msg = new Message();
        msg.add([0, 0, 0, 0, 0, 0, 0, 0, Operation.ChangeUser]);
        msg.addString(Parameter.User, username);
        msg.addString(Parameter.Password, password.value);
        return msg;
    }

    private buffer: Buffer;
    private bufferedLength: number;

    constructor() {
        this.buffer = Buffer.alloc(INITIAL_BUFFER_SIZE);
        this.bufferedLength = 0;
    }

    /**
     * Add given bytes to this message.
     *
     * @param {Buffer} bytes A buffer or array of 8-bit unsigned integer values.
     */
    public add(bytes: Buffer | number[]): void {
        if (!Buffer.isBuffer(bytes)) {
            bytes = Buffer.from(bytes);
        }
        this.appendToBuffer(bytes);
    }

    /**
     * Add given string to this message.
     *
     * @param {Parameter} parameterName The name of the parameter you want to add.
     * @param {string} value The string you want to add.
     */
    public addString(parameterName: Parameter, value: string): void {
        this.add([Type.String, parameterName]);
        let stringSize = Buffer.from([0, 0, 0, 0]);
        htonl(stringSize, 0, value.length + 1);
        this.add(stringSize);
        this.add(term(value));
    }

    public addInt32(parameterName: Parameter, value: number): void {
        this.add([Type.Int32, parameterName]);
        let bytes = Buffer.from([0, 0, 0, 0]);
        htonl(bytes, 0, value);
        this.add(bytes);
    }

    /**
     * Prepare this message to be send.
     */
    public pack(): Buffer {

        // First 4 bytes of the head are the length of the entire message, including the length itself, or'ed with
        // flags, always 0 in our case, in network byte order

        const size = this.bufferedLength + 4;
        let msg: Buffer = Buffer.alloc(size);
        htonl(msg, 0, size);
        this.buffer.copy(msg, 4, 0, this.bufferedLength);
        return msg;
    }

    private appendToBuffer(chunk: Buffer): void {
        const spaceLeft = this.buffer.length - this.bufferedLength;
        if (spaceLeft < chunk.length) {
            const newCapacity = Math.max(this.bufferedLength + chunk.length, 1.5 * this.buffer.length);
            let newBuffer = Buffer.alloc(newCapacity);
            this.buffer.copy(newBuffer);
            this.buffer = newBuffer;
        }
        chunk.copy(this.buffer, this.bufferedLength);
        this.bufferedLength += chunk.length;
    }
}

export class Response {
    public readonly length: number;

    constructor(private buffer: Buffer) {
        this.length = ntohl(buffer, 0);
    }

    public isSimple(): boolean { return this.length === 8; }

    public getInt32(name: Parameter): number {
        const paramIndex = this.getParamIndex(name);
        const headType = this.buffer[paramIndex];
        assert.ok((headType & ~Type.NullFlag) === Type.Int32);
        return ntohl(this.buffer, paramIndex + 2);
    }

    public getString(name: Parameter): string {
        const paramIndex = this.getParamIndex(name);
        const headType = this.buffer[paramIndex];
        assert.ok((headType & ~Type.NullFlag) === Type.String);
        if (headType & Type.NullFlag) {
            return '';
        }
        const strLength = ntohl(this.buffer, paramIndex + 2) - 1;
        // Note: we expect here that the opposite party is a JANUS server compiled with UTF-8 support.
        return this.buffer.toString('utf8', paramIndex + 6, paramIndex + 6 + strLength);
    }

    /**
     * Returns true if this response and otherBuffer have exactly the same bytes and length, false otherwise.
     */
    public equals(otherBuffer: Buffer): boolean {
        return this.buffer.equals(otherBuffer);
    }

    /**
     * Returns true if this response starts with given characters, false otherwise.
     */
    public startsWith(str: string): boolean {
        return this.buffer.includes(str);
    }

    private getParamIndex(name: Parameter) {
        if (this.isSimple()) {
            throw new Error('a simple response cannot have a parameter');
        }

        for (let i = FIRST_PARAM_INDEX; i < this.buffer.length; i = i + this.paramLength(i)) {

            const headName = this.buffer[i + 1];
            if (headName === name) {
                return i;
            }
        }

        // No parameter in this response with that name
        throw new Error(`no such parameter in response: ${name}`);
    }

    private paramLength(paramIndex: number): number {

        // head: 2 bytes
        //       head.type: 1 byte
        //       head.name: 1 byte
        //
        // data: 0 or more bytes, depending on head.type
        //       if head.type is Type.Int32 or Type.Date: 4 bytes
        //       if head.type is Type.OID: 8 bytes
        //       and so on

        assert.ok(paramIndex >= FIRST_PARAM_INDEX && paramIndex < this.buffer.length);

        const headType = this.buffer[FIRST_PARAM_INDEX];

        if (headType & Type.NullFlag) {
            // No data, just the head
            return 2;
        }

        switch (headType & ~Type.NullFlag) {
            case Type.Boolean:
                return 2;
            case Type.Int32:
            case Type.Date:
                return 2 + 4;
            case Type.OID:
                // head: 2 + oid.low: 4 + oid.high: 4
                return 2 + (2 * 4);
            default:
                // head: 2 + size: 4 + whatever the size is
                return 2 + 4 + ntohl(this.buffer, paramIndex + 2);
        }
    }
}

let log = Logger.create('SDSProtocolTransport');

export class SDSProtocolTransport extends EventEmitter {
    constructor(private socket: SocketLike) {
        super();
        this.socket.on('data', (chunk: Buffer) => {
            this.scanParseAndEmit(chunk);
        });
    }

    /**
     * Send given message on TCP socket.
     */
    public send(msg: Message): void {
        let packedMessage = msg.pack();
        log.debug(printBytes('sending', packedMessage));
        this.socket.write(packedMessage);
    }

    /**
     * Disconnect from the server by ending the TCP connection.
     *
     * Actually, this half-closes the socket, so there still might come a response from the other end.
     */
    public disconnect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.socket.on('close', () => resolve());
            this.socket.end();
        });
    }

    private scanParseAndEmit(chunk: Buffer): void {
        log.debug(printBytes('received', chunk));
        let res = new Response(chunk);
        this.emit('response', res);
    }
}

export type ClientId = number;

export type UserId = number;

export class SDSConnection {
    private _clientId: ClientId | undefined;
    private _timeout: number;
    private transport: SDSProtocolTransport;

    /**
     * Create a new connection on given socket.
     */
    constructor(socket: SocketLike) {
        this._timeout = 6000;
        this.transport = new SDSProtocolTransport(socket);
        this._clientId = undefined;
    }

    /**
     * Connect to server.
     *
     */
    public connect(): Promise<void> {
        return this.send(Message.hello()).then((response: Response) => {

            if (!response.equals(ACK)) {
                if (response.startsWith('invalid')) {
                    throw new Error(`server refused connection`);
                } else {
                    throw new Error(`unexpected response`);
                }
            }

            // Hello ack'ed, no SSL, send intro
            let msg = new Message();
            msg.add([0, 0, 0, 0, 0, 0, 0, 0, 0]);
            msg.add(Buffer.from(`vscode-janus-debug on ${os.platform()}`, 'ascii'));
            return this.send(msg);

        }).then((response: Response) => {

            this._clientId = response.getInt32(Parameter.ClientId);

        });
    }

    public changeUser(username: string, password: cryptmd5.Hash): Promise<UserId> {
        return new Promise<UserId>((resolve, reject) => {
            this.send(Message.changeUser(username, password)).then((response: Response) => {
                const result = response.getInt32(Parameter.ReturnValue);
                log.debug(`changeUser returned: ${result}`);
                if (result > 0) {
                    return this.errorMessage(result).then(localizedReason => {
                        let reason: string | undefined;
                        if (localizedReason.startsWith('Login-Name oder Passwort')) {
                            reason = 'username or password incorrect';
                        }
                        reject(reason === undefined ? new Error(`login failed`) : new Error(reason));
                    });
                } else {
                    const userId = response.getInt32(Parameter.UserId);
                    resolve(userId);
                }
            });
        });
    }

    public errorMessage(errorCode: number): Promise<string> {
        return new Promise((resolve) => {
            this.send(Message.errorMessage(errorCode)).then((response: Response) => {
                const reason: string = response.getString(Parameter.ReturnValue);
                resolve(reason);
            });
        });
    }

    /**
     * Send given message on the wire and immediately return a promise that is fulfilled whenever the response
     * comes in or the timeout is reached.
     */
    public send(msg: Message): Promise<Response> {
        let timeout = new Promise<void>((resolve, reject) => {
            setTimeout(reject, this._timeout || 6000, "Request timed out");
        });
        let response: Promise<Response> = this.waitForResponse();
        this.transport.send(msg);
        return Promise.race([response, timeout]);
    }

    /**
     * Set the time in milliseconds after all future requests will timeout.
     * @param {timeout} timeout The timeout in milliseconds.
     */
    set timeout(timeout: number) {
        this._timeout = timeout;
    }

    /**
     * Returns the timeout in milliseconds.
     */
    get timeout(): number {
        return this._timeout;
    }

    /**
     * Disconnect from the server.
     */
    public disconnect(): Promise<void> {
        return this.send(Message.disconnectClient()).then(() => {
            return this.transport.disconnect();
        });
    }

    /**
     * Returns the client ID.
     */
    get clientId(): number | undefined {
        return this._clientId;
    }

    /**
     * Make a new promise that is resolved once a 'response' event is triggered.
     */
    private waitForResponse = (): Promise<Response> => {
        return new Promise(resolve => {
            this.transport.once('response', resolve);
        });
    }
}
