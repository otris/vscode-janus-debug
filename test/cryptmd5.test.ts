'use strict';

import * as assert from 'assert';
import { crypt_md5, Hash } from '../src/cryptmd5';

suite('test crypt_md5 function', () => {
    test('with long salt', () => {
        const result = crypt_md5('teddybear', 'sangria');
        assert.equal('$1$sangria$X7w3Wluq/7ZJ/fvuJlXCk0', result.value);
    });

    test('with 2 character salt', () => {
        const result = crypt_md5('admin', 'o3');
        assert.equal('$1$o3$A.ufmcH6EA71sEDrh.UXn.', result.value);
    });

    test('with no salt', () => {
        const result = crypt_md5('fassbrause', '');
        assert.equal('$1$$WZs9R8PCfo0sEsolRc9Qq0', result.value);
    });
});
