import * as assert from 'assert';
import { cantorPairing, reverseCantorPairing } from '../src/cantor';

suite('cantor algorithm tests', () => {

    test('pairing', () => {
        assert.equal(cantorPairing(47, 32), 3192);
    });

    test('reverse pairing', () => {
        const result = reverseCantorPairing(1432);
        assert.equal(result.x, 52);
        assert.equal(result.y, 1);
    });
});
