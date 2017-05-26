'use strict';

import * as assert from 'assert';
import { EventEmitter } from 'events';
import { SocketLike } from 'node-sds';
import { parseResponse } from './protocol';

const INITIAL_BUFFER_SIZE = 4 * 1024;
const SEPARATOR = 10; // decimal ASCII value for '\n'

export class DebugProtocolTransport extends EventEmitter {

    private buffer: Buffer;
    private bufferedLength: number;

    constructor(private socket: SocketLike) {
        super();

        this.buffer = Buffer.alloc(INITIAL_BUFFER_SIZE);
        this.bufferedLength = 0;

        this.socket.on('data', (chunk: Buffer) => {
            this.scanParseAndEmit(chunk);
        });
    }

    public sendMessage(msg: string): void {
        const buf = Buffer.from(msg, 'utf-8');
        this.socket.write(buf);
    }

    public disconnect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.socket.on('close', () => resolve());
            this.socket.end();
        });
    }

    private scanParseAndEmit(chunk: Buffer): void {
        const sepIdx = chunk.indexOf(SEPARATOR);

        if ((this.bufferedLength === 0) && (sepIdx === (chunk.length - 1))) {
            // Got a mouthful. No need to copy anything
            const response = chunk.toString('utf-8');
            this.emit('response', parseResponse(response));
            return;
        }

        if (sepIdx === -1) {
            // No separator
            this.appendToBuffer(chunk);
            return;
        }

        this.appendToBuffer(chunk.slice(0, sepIdx + 1));

        // Buffer contains a complete response. Parse and emit
        const response = this.buffer.toString('utf-8', 0, this.bufferedLength);
        this.emit('response', parseResponse(response));
        this.buffer.fill(0);
        this.bufferedLength = 0;

        if ((sepIdx + 1) < chunk.length) {
            // Continue with remainder
            this.scanParseAndEmit(chunk.slice(sepIdx + 1));
        }
    }

    private appendToBuffer(chunk: Buffer): void {
        const spaceLeft = this.buffer.length - this.bufferedLength;
        if (spaceLeft < chunk.length) {
            const newCapacity = Math.max(this.bufferedLength + chunk.length, 1.5 * this.buffer.length);
            const newBuffer = Buffer.alloc(newCapacity);
            this.buffer.copy(newBuffer);
            this.buffer = newBuffer;
        }
        chunk.copy(this.buffer, this.bufferedLength);
        this.bufferedLength += chunk.length;
    }
}
