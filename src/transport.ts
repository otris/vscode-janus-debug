'use strict';

import * as assert from 'assert';
import { EventEmitter } from 'events';
import { Logger } from 'node-file-log';
import { SocketLike } from 'node-sds';
import { parseResponse, Response } from './protocol';

const INITIAL_BUFFER_SIZE = 4 * 1024;
const SEPARATOR = 10; // decimal ASCII value for '\n'

const log = Logger.create('DebugProtocolTransport');

export class DebugProtocolTransport extends EventEmitter {

    private buffer: Buffer;
    private bufferedLength: number;

    constructor(private socket: SocketLike) {
        super();

        this.buffer = Buffer.alloc(INITIAL_BUFFER_SIZE);
        this.bufferedLength = 0;

        this.socket.on('data', (chunk: Buffer) => {
            log.debug(`received data on the socket: "${chunk}"`);
            this.scanParseAndEmit(chunk);
        });

        this.socket.on('error', () => {
            log.error(`received an error on the socket, maybe you connected on the wrong TCP port?`);
        });
    }

    public sendMessage(msg: string): void {
        log.debug(`write on the socket`);
        const buf = Buffer.from(msg, 'utf-8');
        this.socket.write(buf);
    }

    public disconnect(): Promise<void> {
        log.debug(`somebody wants us to disconnect from the socket`);
        return new Promise<void>((resolve, reject) => {
            this.socket.on('close', () => resolve());
            this.socket.end();
        });
    }

    private scanParseAndEmit(chunk: Buffer): void {
        const sepIdx = chunk.indexOf(SEPARATOR);

        if ((this.bufferedLength === 0) && (sepIdx === (chunk.length - 1))) {
            // Got a mouthful. No need to copy anything
            let response: Response;

            const str = chunk.toString('utf-8');
            try {
                response = parseResponse(str);
            } catch (e) {
                log.info(`parsing response "${str}" failed; hanging up`);
                this.disconnect();
                this.emit('error',
                `Could not understand the server's response. Did you connect on the right port?`);
                return;
            }

            this.emit('response', response);
            return;
        }

        if (sepIdx === -1) {
            // No separator
            this.appendToBuffer(chunk);
            return;
        }

        this.appendToBuffer(chunk.slice(0, sepIdx + 1));

        // Buffer contains a complete response. Parse and emit
        let response: Response;
        const str = this.buffer.toString('utf-8', 0, this.bufferedLength);
        try {
            response = parseResponse(str);
        } catch (e) {
            log.info(`parsing response "${str}" failed; hanging up`);
            this.disconnect();
            this.emit('error',
                `Could not understand the server's response. Did you connect on the right port?`);
            return;
        }

        this.emit('response', response);
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
