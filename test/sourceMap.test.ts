import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LocalSource, ServerSource, SourceMap } from '../src/sourceMap';

suite('local source tests', () => {

    suite('w/o a file on disk', () => {

        const somePath = '/foo/bar/baz.js';

        test('initialization', () => {
            const source = new LocalSource(somePath);
            assert.equal(source.sourceReference, 0);
            assert.equal(source.aliasNames.length, 0);
            assert.equal(source.name, 'baz.js');
        });

        test('loadFromDisk should fail', done => {
            const source = new LocalSource(somePath);
            source.loadFromDisk().then(code => {
                done(new Error('expected an error'));
            }).catch(err => {
                done();
            });
        });
    });

    suite('with a real file', () => {

        let tempDir: string;
        let somePath: string;
        const sourceCode = 'return "Hello, world!";\n';

        setup(() => {
            tempDir = fs.mkdtempSync(os.tmpdir() + path.sep);
            somePath = tempDir + path.sep + 'baz.js';
            const fd = fs.openSync(somePath, 'w');
            fs.writeFileSync(somePath, sourceCode);
        });

        teardown(() => {
            fs.unlinkSync(somePath);
            // Timeout because otherwise we get a ENOTEMPTY in fs.rmdir; bug in node?
            setTimeout(() => { fs.rmdirSync(tempDir); }, 1000);
        });

        test('load code from disk', done => {
            const source = new LocalSource(somePath);
            source.loadFromDisk().then(code => {
                assert.equal(code, sourceCode);
                done();
            }).catch(err => done(err));
        });
    });
});

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

    test('get source by reference returns undefined for references ≤ 0', () => {
        assert.equal(sourceMap.getSourceByReference(0), undefined);
        assert.equal(sourceMap.getSourceByReference(-1), undefined);
    });

    suite('local → remote', () => {

        test('different path but base name is equal', () => {
            const result = sourceMap.getRemoteUrl('/Users/bob/fubar/src/server/script1.js');
            assert.equal(result, '/usr/lib/fubar/script1.js');
        });

        test('if no remote name can be found, fallback to local path', () => {
            const result = sourceMap.getRemoteUrl('/Users/bob/fubar/bielefeld.js');
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
            const result = sourceMap.getSource('remoteName');
            const path = result ? result.path : '';
            assert.equal(path, 'someScript.js');
        });
    });

    suite('server source', () => {

        suite('construct from source lines', () => {
            const sourceLines = [
                /* line on server                                                   file/line */
                /*  1 not visible to user */ "debugger;",
                /*  2                     */ "//# 0 lib",                        /* lib.js   */
                /*  3                     */ "var x=1;",                         /*  1       */
                /*  4                     */ "x=2;",                             /*  2       */
                /*  5                     */ "util.out(\"lib.js: \" + x);",      /*  3       */
                /*  6                     */ "a.push(\"0\");",                   /*  4       */
                /*  7                     */ "",                                 /*  5       */
                /*  8                     */ "//# 2 test1",                      /* test1.js */
                /*  9                     */ "",                                 /*  1       */
                /* 10                     */ "a.push(\"1\");",                   /*  2       */
                /* 11                     */ "a.push(\"2\");",                   /*  3       */
                /* 12                     */ "a.push(\"3\");",                   /*  4       */
                /* 13                     */ "a.push(\"4\");",                   /*  5       */
                /* 14                     */ "util.out(\"Done\");"               /*  6       */
            ];

            test("parse into chunks", () => {
                const s = ServerSource.fromSources(sourceLines);
                assert.equal(s.chunks.length, 2);
                assert.equal(s.chunks[0].name, 'lib');
                assert.equal(s.chunks[1].name, 'test1');
            });

            test("map to individual source files", () => {
                const s = ServerSource.fromSources(sourceLines);
                assert.deepEqual(s.toLocalPosition(10), { source: 'test1', line: 2 });
                assert.deepEqual(s.toLocalPosition(3), { source: 'lib', line: 1 });
            });

            test("first line debugger; statement maps to first line of first chunk", () => {
                const s = ServerSource.fromSources(sourceLines);
                assert.deepEqual(s.toLocalPosition(1), { source: 'lib', line: 1 });
            });

            test("pre-processor line maps to first line of next chunk", () => {
                const s = ServerSource.fromSources(sourceLines);
                assert.deepEqual(s.toLocalPosition(2), { source: 'lib', line: 1 });
                assert.deepEqual(s.toLocalPosition(8), { source: 'test1', line: 1 });
            });
        });
    });
});
