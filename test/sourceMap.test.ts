'use strict';

import * as assert from 'assert';
import * as path from 'path';
import { LocalSource, SourceMap } from '../src/sourceMap';

suite('source map tests', () => {

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

    test('size method returns no. of all of mappings', () => {
        assert.equal(sourceMap.size, 4);
    });

    test('clear method removes all mappings', () => {
        sourceMap.clear();
        assert.equal(sourceMap.size, 0);
    });

    test('setAllRemoteUrls method removes previous mappings', () => {
        sourceMap.setAllRemoteUrls(['fubar.js']);
        assert.equal(sourceMap.size, 1);
    });

    suite('local → remote', () => {

        test('different path but base name is equal', () => {
            const result = sourceMap.getRemoteUrl('/Users/bob/fubar/src/server/script1.js');
            assert.equal(result, '/usr/lib/fubar/script1.js');
        });

        test('if no remote name can be found, fallback to local path', () => {
            let result = sourceMap.getRemoteUrl('/Users/bob/fubar/bielefeld.js');
            assert.equal(result, '/Users/bob/fubar/bielefeld.js');
        });

        test('add a single mapping directly', () => {
            const initialSize = sourceMap.size;
            sourceMap.addMapping(new LocalSource('/home/bob/script.js'), 'remoteName');
            assert.equal(sourceMap.size, initialSize + 1);
            const result = sourceMap.getRemoteUrl('/home/bob/script.js');
            assert.equal(result, 'remoteName');
        });
    });

    suite('remote → local', () => {

        test('map single local file to remote name', () => {
            sourceMap.addMapping(new LocalSource('someScript.js'), 'remoteName');
            const result = sourceMap.getLocalSource('remoteName');
            assert.equal(result.path, 'someScript.js');
        });
    });
});
