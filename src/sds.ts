/**
 * SDS (or SDS2) is a synchronous binary application-layer protocol on top of TCP that "real" JANUS clients use to
 * speak to JANUS servers. I could not find any document describing the protocol but there is a C++ library that you
 * can use to "reverse-engineer" the protocol (You find it under `src/janus/2.9.6/srvclnt`). The protocol is one of
 * those historic mistakes that never got fixed.
 *
 * Layout of a Typical Message
 *
 * Saying "Hello" in SDS
 */

import * as assert from 'assert';
import { EventEmitter } from 'events';
import { connect } from 'net';
import * as os from 'os';
import { Logger } from './log';
import { ntohl, htonl, SocketLike } from './network';

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
    let units = str.split('').map((char) => { return char.charCodeAt(0); });
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
function printBytes(msg: string, buf: Buffer): string {
    let str = `${msg} ${buf.length}: [\n`;
    let column = 0;
    let i = 0;
    for (; i < buf.length; i++) {
        if (column === 8) {
            column = 0;
            str += `\n`;
        }
        column++;
        let hex: string = buf[i].toString(16);
        str += (hex.length === 1 ? '0' + hex : hex) + ' ';
    }
    str += `\n]`;
    return str;
}

enum Operation {
    GETERGNAME = 1,
    GETLISTERGNAME,
    GETDESCRIPTION,
    GETATTRIBUTES,
    GETCLASSES,
    GETSUBCLASSES,
    ISSUBCLASS,
    GETSUPERCLASSES,
    ISABSTRACT,
    GETCLASS,
    GETID,
    GETMODELIDS,
    GETMINMAXCARD,
    GETASSOCS,
    GETASSOCCLASS,
    GETINVERSERELATION,
    ERRORMESSAGE,
    GETDATABASESERVER,
    GETMODEL,
    GETNUMLANG,
    GETLANGS,
    ISMULTIUSER,
    SUPPORTSPRINCIPALS,
    GETCURRENCYCLASS,
    GETUSERCLASS,
    GETPRINCIPALCLASS,
    GETENUMCONST,
    GETLOCALUSERNAMESPACE,
    SETLANG,
    GETTIPSOFTHEDAY,
    GETALLENUMS,
    HASEXTERNALPASSWORDS,
    GETLANGCODES = 40,
    GETEXTRAATTR,
    RUNSCRIPTONSERVER,
    DBUTF8 = 71,
}

enum ParameterName {
    GETNEWCLIENTID = 1,
    CLASSNAME,
    OTHEROBJECTID,
    VALUE,
    RETURNVALUE,
    SOMETHING = 8,
    RELNAME,
    ITERID,
    ITEROFFS,
    LEN,
    INDEX,
    LANG,
    CLASSID = 16,
    LISTNAME,
    ISTRANSOBJ,
    LOCKMODE = 19,
    LOCKGROUP,
    USER,
    PASSWORD,
    SSLLEVEL,
    FIRST,
    LAST,
    ATTRS = 26,
    PROPERTIES = 29,
    SORTEXPR,
    FILTEREXPR,
    NEWNAME,
    GETMODELID1 = 34,
    GETMODELID2,
    ENUMNAME,
    ENUMELEMENTS = 38,
    ENUMCODES,
    USERID,
    ALLGROUPS,
    SELECTEDGROUPS,
    SELECT,
    USEBASE,
    FULLNAME,
    PASSEXPIRE,
    ACCOUNTEXPIRE,
    PARAMETER = 48,
    PARAMETER_PDO,
    INIT = 53,
    READ,
    WRITE,
    FROM = 58,
    TO,
    GROUP = 64,
    JAPSCOPE = 70,
    JAPPARSEDCONTENT = 74,
    ENUMACTIVE = 78,
    PRINCIPALS,
    PRINCIPAL,
    PRINCIPALID,
    USERS,
    START,
    CONTENT,
    SIZE,
    MESSAGE,
    FILENAME,
    OPCODE,
    FLAG = 119,
}

enum Type {
    Boolean = 2,
    Int32,
    Date,
    String = 7,
    OID = 9,
    Int32List,
    StringList,
    OIDList,
    NullFlag = 128, // 0x80
}

export class Message {
    public static from(buf: Buffer): Message {
        let msg = new Message();
        msg.buffer = buf;
        msg.bufferedLength = buf.length;
        return msg;
    }

    private buffer: Buffer;
    private bufferedLength: number;

    constructor() {
        this.buffer = Buffer.alloc(INITIAL_BUFFER_SIZE);
        this.bufferedLength = 0;
    }

    public add(bytes: Buffer): void {
        this.appendToBuffer(bytes);
    }

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

    public getInt32(name: ParameterName): number {
        const paramIndex = this.getParamIndex(name);
        const headType = this.buffer[paramIndex];
        assert.ok((headType & ~Type.NullFlag) === Type.Int32);
        return ntohl(this.buffer, paramIndex + 2);
    }

    /**
     * Returns true if this reponse and otherBuffer have exactly the same bytes and length, false otherwise.
     */
    public equals(otherBuffer: Buffer): boolean {
        return this.buffer.equals(otherBuffer);
    }

    private getParamIndex(name: ParameterName) {
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
        log.debug(`received: '${chunk}', length: ${chunk.length}`);
        let res = new Response(chunk);
        this.emit('response', res);
    }
}

export class SDSConnection {
    private _clientId: number | undefined;
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
     * Precondition: TCP connection established.
     *
     * A connection is "established" after following sequence of messages got exchanged.
     *
     * 1. We send a short "Hello"-like message.
     * 2. The server acknowledges this message with a short response, possibly negotiating SSL terms.
     * 3. We introduce ourselves by sending a short string containing our client's name.
     * 4. The server responds with a client ID that we store.
     *
     * The client ID can be used to track this connection in the server's log files later on. I presume this client ID
     * is solely useful for logging and debugging purposes. A connection is closed simply by ending the TCP connection
     * (by sending a FIN packet). The server usually notes this as a "client crashed" event in the log files. However,
     * every existing client seems to do it this way. You can use the disconnect() method for this.
     */
    public connect(): Promise<void> {
        this.transport.send(Message.from(HELLO));
        return this.waitForResponse().then((response: Response) => {
            if (!response.equals(ACK)) {
                throw new Error(`unexpected response`);
            }

            // Hello ack'ed, no SSL, send intro
            let msg = new Message();
            msg.add(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0]));
            msg.add(Buffer.from(`vscode-janus-debug on ${os.platform()}`, 'ascii'));
            this.transport.send(msg);
            return this.waitForResponse();

        }).then((response: Response) => {

            this._clientId = response.getInt32(ParameterName.GETNEWCLIENTID);

        }).catch((reason) => {
            let what = `could not establish connection to server: ${reason.toString()}`;
            log.debug(what);
            throw new Error(what);
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
        return this.transport.disconnect();
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
        return new Promise((resolve) => {
            this.transport.once('response', resolve);
        });
    }
}

/*
let port: number = 10019;
let host: string = '192.168.10.32';
let socket: any;

socket = connect(port, host);

socket.on('connect', () => {
    log.debug(`connected to ${host}:${port}`);

    socket.write(HELLO);
});

socket.on('close', (hadError) => {
    log.debug(`remote closed the connection`);
});

socket.on('error', (err: Error) => {
    log.debug(`failed to connect: ${err}`);
});
*/
