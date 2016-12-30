import { EventEmitter } from 'events';
import { connect } from 'net';
import * as os from 'os';
import { Logger } from './log';
import { SocketLike } from './transport';

const HELLO: Buffer = Buffer.from('GGCH$1$$', 'ascii');
const ACK: Buffer = Buffer.from(term('valid'));
const INITIAL_BUFFER_SIZE = 4 * 1024;

/**
 * Converts a 32-bit quantity (long integer) from host byte order to network byte order (little- to big-endian).
 *
 * @param {Buffer} b Buffer of octets
 * @param {number} i Zero-based index at which to write into b
 * @param {number} v Value to convert
 */
export function htonl(b: Buffer, i: number, val: number): void {
    b[i + 0] = (0xff & (val >> 24));
    b[i + 1] = (0xff & (val >> 16));
    b[i + 2] = (0xff & (val >>  8));
    b[i + 3] = (0xff & (val));
};

/**
 * Converts a 32-bit quantity (long integer) from network byte order to host byte order (big- to little-endian).
 *
 * @param {Buffer} b Buffer to read value from
 * @param {number} i Zero-based index at which to read from b
 */
export function ntohl(b: Buffer, i: number): number {
    return ((0xff & b[i + 0]) << 24) |
           ((0xff & b[i + 1]) << 16) |
           ((0xff & b[i + 2]) <<  8) |
           ((0xff & b[i + 3]));
};

/**
 * Returns an array of all UTF-16 code units in given string plus a 0-terminus.
 * 
 * Hint: As long as given string consists only of characters in the ASCII character subset the result looks pretty much
 * like a C-style string.
 */
function term(str: string): number[] {
    let units = str.split('').map((char) => { return char.charCodeAt(0); });
    units.push(0);
    return units;
}

enum ParameterName {
    GETNEWCLIENTID = 1,
}

class Message {
    private flags: number;
    private buffer: Buffer;
    private bufferedLength: number;

    constructor() {
        this.buffer = Buffer.alloc(INITIAL_BUFFER_SIZE);
        this.bufferedLength = 0;
        this.flags = 0;
    }

    public add(value: string, encoding: string): void {
        this.appendToBuffer(Buffer.from(value, encoding));
    }

    public pack(): Buffer {
        let msg: Buffer = Buffer.alloc(1024);

        // First 4 bytes of the head are the length of the entire message, including the length itself, or'ed with the
        // flags, in network byte order

        htonl(msg, 0, this.bufferedLength + 4 | this.flags);
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

class Response {
    public readonly length: number;

    constructor(private buffer: Buffer) {
        /* */
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

    public disconnect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.socket.on('close', () => resolve());
            this.socket.end();
        });
    }

    private scanParseAndEmit(chunk: Buffer): void {
        log.debug(`received: '${chunk}', length: ${chunk.length}`);

        if (chunk.equals(ACK)) {
            // hello ack'ed, no SSL
            let msg = new Message();
            msg.add(`vscode-janus-debug on ${os.platform()}`, 'ascii');
            socket.write(msg.pack());
        } else {
            let res = new Response(chunk);
            this.emit('response', res);
        }
    }
}

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
