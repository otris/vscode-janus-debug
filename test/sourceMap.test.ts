'use strict';

import * as assert from 'assert';
import { SourceMap } from '../src/sourceMap';

suite('source map tests', () => {

    suite('remoteSourceUrl', () => {

        let sourceMap: SourceMap;

        setup(() => {
            sourceMap = new SourceMap();
            sourceMap.setAllRemoteUrls([
                '/usr/lib/fubar/script1.js',
                '/usr/lib/fubar/extension/script2.js',
                '/usr/lib/fubar/extension/script3.js',
                '/usr/lib/fubar/script4.js',
            ]);
        });

        test('different urls on localhost and target', () => {
            let result = sourceMap.remoteSourceUrl('/Users/bob/fubar/src/server/script1.js');
            assert.equal(result, '/usr/lib/fubar/script1.js');
        });

        test('fallback to local url', () => {
            let result = sourceMap.remoteSourceUrl('/Users/bob/fubar/bielefeld.js');
            assert.equal(result, '/Users/bob/fubar/bielefeld.js');
        });
    });
});
