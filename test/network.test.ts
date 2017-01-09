'use strict';

import * as assert from 'assert';
import { htonl, ntohl, SocketLike } from '../src/network';

suite('byte order tests', () => {

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
