'use strict';

/**
 * Something that behaves like a bloody Node socket.
 */
export interface SocketLike {
    on(event: string, handler: Function);
    write(buffer: Buffer);
    write(str: string, encoding: string);
    end();
}

/**
 * Convert a 32-bit quantity (long integer) from host byte order to network byte order (little- to big-endian).
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
 * Convert a 32-bit quantity (long integer) from network byte order to host byte order (big- to little-endian).
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
