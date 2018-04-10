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
            assert.equal(source.aliasNames.length, 2);
            assert.equal(source.name, 'baz.js');
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

        test('load code from disk', () => {
            const source = new LocalSource(somePath);
            const code = source.loadFromDisk();
            assert.equal(code, sourceCode);
        });
    });
});

suite('source map tests', () => {

    let sourceMap: SourceMap;

    const sourceLines = [
        /* line on server                                                 line on disk                           */
        /*  1 not visible to user */ "debugger;",
        /*  2                     */ "//# 0 lib",                      /*                                        */
        /*  3                     */ "var x=1;",                       /*  1                                     */
        /*  4                     */ "x=2;",                           /*  2                                     */
        /*  5                     */ "util.out(\"lib.js: \" + x);",    /*  3                                     */
        /*  6                     */ "a.push(\"0\");",                 /*  4                                     */
        /*  7                     */ "",                               /*  5                                     */



        /*  8                     */ "//# 2 test1",                    /*  1                                     */
        /*  9                     */ "",                               /*  2                                     */
        /* 10                     */ "a.push(\"1\");",                 /*  3                                     */
        /* 11                     */ "a.push(\"2\");",                 /*  4                                     */
        /* 12                     */ "a.push(\"3\");",                 /*  5                                     */
        /* 13                     */ "a.push(\"4\");",                 /*  6                                     */
        /* 14                     */ "util.out(\"Done\");"             /*  7                                     */
    ];


    suite('server source', () => {

        test("parse into chunks", () => {
            const s = ServerSource.fromSources(sourceLines);
            assert.equal(s.chunks.length, 2);
            assert.equal(s.chunks[0].name, 'lib');
            assert.equal(s.chunks[0].pos.start, 3);
            assert.equal(s.chunks[0].pos.len, 5);

            assert.equal(s.chunks[1].name, 'test1');
            assert.equal(s.chunks[1].pos.start, 8);
            assert.equal(s.chunks[1].pos.len, 7);
        });

        test("map to individual source files", () => {
            const s = ServerSource.fromSources(sourceLines);
            assert.deepEqual(s.toLocalPosition(10), { source: 'test1', line: 3 });
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

        test("parse pre-processor comment line", () => {
            const lines = [
                "//# 0 Gadget_appConnectOfflineApp",
                "",
                "//# 1 UPPERCASE",
                "",
                "//# 2 appAddToFavorites",
                "",
                "//# 3 appAdditional.Settings",
                "",
                "  //# 4 appCall_INIT  ",
                "",
                "//# 9 appConfigImportExportLibrary",
                "",
                "//# 10 appConfigImporter",
                "",
                "//# 11 appConfigJumpBackToMain",
                "",
                "//# 16 appFileConfig_Importer",
                "",
                "//# 17 appFileConfig_getAutoRank42",
                "",
                "//# 18 appFileTypeEnum",
                "",
                "//# 19 appFoldersEnum",
                "",
                " //# 20 appLinkRegistersEnum",
                "",
                "	//# 21 appListConfig_Exporter",
                "",
                "//# 25 appMainConfig_OnDelete",
                "",
                "//# 26 appMainConfig_OnSave",
                "",
                "//# 28 .appMarkAsRead",
                "",
                "//# 29 appPerformWorkflowAction",
                "",
                "//# 32 crmAccount_MailSent#",
                "",
                "//# 33 crmAccount_4711TransferAddressToContacts",
                "",
                "//# 34 crmAccount_onDelete#",
                "",
                "//# 35 crmAppointment_New  ",
                "",
                "//# 36 crmCampaign_FillMultipleVeryLongLines#",
                "",
            ];
            const s = ServerSource.fromSources(lines);
            assert.equal(s.chunks.length, 23);
        });
    });

    suite("mapping 2 chunks", () => {

        let tempDir: string;
        const paths: string[] = [];
        const libSourceCode =
            /*  1                 */ `var x=1;\n` +
            /*  2                 */ `x=2;\n` +
            /*  3                 */ `util.out(\"lib.js: \" + x);\n` +
            /*  4                 */ `a.push(\"0\");\n` +
            /*  5                 */ ``;
        const test1SourceCode =
            /*  1                 */ `//#import "lib"\n` +
            /*  2                 */ `\n` +
            /*  3                 */ `a.push(\"1\");\n` +
            /*  4                 */ `a.push(\"2\");\n` +
            /*  5                 */ `a.push(\"3\");\n` +
            /*  6                 */ `a.push(\"4\");\n` +
            /*  7                 */ `util.out(\"Done\");\n`;

        setup(() => {
            tempDir = fs.mkdtempSync(os.tmpdir() + path.sep);

            const writeTestFile = (fileName: string, sourceCode: string) => {
                const p = tempDir + path.sep + fileName;
                const fd = fs.openSync(p, 'w');
                fs.writeFileSync(p, sourceCode);
                paths.push(p);
            };

            writeTestFile('lib.js', libSourceCode);
            writeTestFile('test1.js', test1SourceCode);

            sourceMap = new SourceMap();
        });

        teardown(() => {
            paths.forEach(p => fs.unlinkSync(p));
            // Timeout because otherwise we get a ENOTEMPTY in fs.rmdir
            setTimeout(() => { fs.rmdirSync(tempDir); }, 1000);
        });

        test("remote line to local position", () => {
            sourceMap.serverSource = ServerSource.fromSources(sourceLines);
            sourceMap.setLocalUrls(paths);
            assert.deepEqual(sourceMap.toLocalPosition(1), { source: 'lib', line: 1 });
            assert.deepEqual(sourceMap.toLocalPosition(3), { source: 'lib', line: 1 });
            assert.deepEqual(sourceMap.toLocalPosition(4), { source: 'lib', line: 2 });
            assert.deepEqual(sourceMap.toLocalPosition(6), { source: 'lib', line: 4 });
            assert.deepEqual(sourceMap.toLocalPosition(10), { source: 'test1', line: 3 });
            assert.deepEqual(sourceMap.toLocalPosition(14), { source: 'test1', line: 7 });
        });
    });

    setup(() => {
        sourceMap = new SourceMap();
    });

    test('get source by reference returns undefined for references ≤ 0', () => {
        assert.equal(sourceMap.getSourceByReference(0), undefined);
        assert.equal(sourceMap.getSourceByReference(-1), undefined);
    });

    suite('local → remote', () => {

        test('add a single mapping directly', () => {
            sourceMap.addMapping(new LocalSource('/home/bob/script.js'), 'remoteName');
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

    suite("mapping 3 chunks", () => {

        const sourceLines2 = [
            /* line on server                                                 line on disk                           */
            /*  1                     */ "debugger;",                      /*                                        */
            /*  2                     */ "//# 0 lib2",                     /*                                        */
            /*  3                     */ "//# 0 lib1",                     /*                                        */
            /*  4                     */ "util.out(\">>> in lib1.js\");",  /*  1       util.out(">>> in lib1.js");   */
            /*  5                     */ "var val = 0;",                   /*  2       var val = 0;                  */
            /*  6                     */ "",                               /*  3                                     */
            /*  7                     */ "//# 1 lib2",                     /*  1       //#import "lib1"              */
            /*  8                     */ "util.out(\">>> in lib2.js\");",  /*  2       util.out(">>> in lib2.js");   */
            /*  9                     */ "val = val + 1;",                 /*  3       val = val + 1;                */
            /* 10                     */ "",                               /*  4                                     */
            /* 11                     */ "//# 2 main",                     /*  1       //#import "lib2"              */
            /* 12                     */ "util.out(\">>> in main.js\");",  /*  2       util.out(">>> in main.js");   */
            /* 13                     */ "val = val + 1;",                 /*  3       val = val + 1;                */
            /* 14                     */ "util.out(\">>> val = \" + val);" /*  4       util.out(">>> val = " + val); */
        ];

        let tempDir: string;
        const paths: string[] = [];
        const lib1SourceCode =
            /*  1                 */ `util.out(">>> in lib1.js");\n` +
            /*  2                 */ `var val = 0;\n`;

        const lib2SourceCode =
            /*  1                 */ `//#import "lib1"\n` +
            /*  2                 */ `util.out(">>> in lib2.js");\n` +
            /*  3                 */ `val = val + 1;\n`;

        const mainSourceCode =
            /*  1                 */ `//#import "lib2"\n` +
            /*  2                 */ `util.out(">>> in main.js");\n` +
            /*  3                 */ `val = val + 1;\n` +
            /*  4                 */ `util.out(">>> val = " + val);\n`;

        setup(() => {
            tempDir = fs.mkdtempSync(os.tmpdir() + path.sep);

            const writeTestFile = (fileName: string, sourceCode: string) => {
                const p = tempDir + path.sep + fileName;
                const fd = fs.openSync(p, 'w');
                fs.writeFileSync(p, sourceCode);
                paths.push(p);
            };

            writeTestFile('lib1.js', lib1SourceCode);
            writeTestFile('lib2.js', lib2SourceCode);
            writeTestFile('main.js', mainSourceCode);

            sourceMap = new SourceMap();
        });

        teardown(() => {
            paths.forEach(p => fs.unlinkSync(p));
            // Timeout because otherwise we get a ENOTEMPTY in fs.rmdir
            setTimeout(() => { fs.rmdirSync(tempDir); }, 1000);
        });

        test("remote line to local position", () => {
            sourceMap.serverSource = ServerSource.fromSources(sourceLines2);
            sourceMap.setLocalUrls(paths);
            assert.deepEqual(sourceMap.toLocalPosition(1), { source: 'lib1', line: 1 });
            assert.deepEqual(sourceMap.toLocalPosition(4), { source: 'lib1', line: 1 });
            assert.deepEqual(sourceMap.toLocalPosition(5), { source: 'lib1', line: 2 });
            assert.deepEqual(sourceMap.toLocalPosition(8), { source: 'lib2', line: 2 });
            assert.deepEqual(sourceMap.toLocalPosition(12), { source: 'main', line: 2 });
        });
    });

    suite("mapping 4 chunks", () => {

        const sourceLines3 = [
            /* line on server                                                  line on disk                           */
            /*  1                     */ "debugger;",                       /*                                        */
            /*  2                     */ "//# 0 lib3",                      /*                                        */
            /*  3                     */ "//# 0 lib2",                      /*                                        */
            /*  4                     */ "//# 0 lib1",                      /*                                        */
            /*  5                     */ "util.out(\">>> in lib1.js\");",   /*  1 util.out(">>> in lib1.js");         */
            /*  6                     */ "var val = 0;",                    /*  2 var val = 0;                        */
            /*  7                     */ "",                                /*  3                                     */
            /*  8                     */ "//# 1 lib2",                      /*  1 //#import "lib1"                    */
            /*  9                     */ "util.out(\">>> in lib2.js\");",   /*  2 util.out(">>> in lib2.js");         */
            /* 10                     */ "val = val + 1;",                  /*  3 val = val + 1;                      */
            /* 11                     */ "",                                /*  4                                     */
            /* 12                     */ "//# 1 lib3",                      /*  1 //#import "lib2"                    */
            /* 13                     */ "util.out(\">>> in lib3.js\");",   /*  2 util.out(">>> in lib3.js");         */
            /* 14                     */ "val = val + 1;",                  /*  3 val = val + 1;                      */
            /* 15                     */ "",                                /*  4                                     */
            /* 16                     */ "//# 2 main",                      /*  1 //#import "lib3                     */
            /* 17                     */ "util.out(\">>> in main.js\");",   /*  2 util.out(">>> in main.js");         */
            /* 18                     */ "val = val + 1;",                  /*  3 val = val + 1;                      */
            /* 19                     */ "util.out(\">>> val = \" + val);", /*  4 util.out(">>> val = " + val);       */
        ];

        let tempDir: string;
        const paths: string[] = [];
        const lib1SourceCode =
            /*  1                 */ `util.out(">>> in lib1.js");\n` +
            /*  2                 */ `var val = 0;\n`;

        const lib2SourceCode =
            /*  1                 */ `//#import "lib1"\n` +
            /*  2                 */ `util.out(">>> in lib2.js");\n` +
            /*  3                 */ `val = val + 1;\n`;

        const lib3SourceCode =
            /*  1                 */ `//#import "lib2"\n` +
            /*  2                 */ `util.out(">>> in lib3.js");\n` +
            /*  3                 */ `val = val + 1;\n`;

        const mainSourceCode =
            /*  1                 */ `//#import "lib3"\n` +
            /*  2                 */ `util.out(">>> in main.js");\n` +
            /*  3                 */ `val = val + 1;\n` +
            /*  4                 */ `util.out(">>> val = " + val);\n`;

        setup(() => {
            tempDir = fs.mkdtempSync(os.tmpdir() + path.sep);

            const writeTestFile = (fileName: string, sourceCode: string) => {
                const p = tempDir + path.sep + fileName;
                const fd = fs.openSync(p, 'w');
                fs.writeFileSync(p, sourceCode);
                paths.push(p);
            };

            writeTestFile('lib1.js', lib1SourceCode);
            writeTestFile('lib2.js', lib2SourceCode);
            writeTestFile('lib3.js', lib3SourceCode);
            writeTestFile('main.js', mainSourceCode);

            sourceMap = new SourceMap();
        });

        teardown(() => {
            paths.forEach(p => fs.unlinkSync(p));
            // Timeout because otherwise we get a ENOTEMPTY in fs.rmdir
            setTimeout(() => { fs.rmdirSync(tempDir); }, 1000);
        });

        test("remote line to local position", () => {
            sourceMap.serverSource = ServerSource.fromSources(sourceLines3);
            sourceMap.setLocalUrls(paths);
            assert.deepEqual(sourceMap.toLocalPosition(1), { source: 'lib1', line: 1 });
            assert.deepEqual(sourceMap.toLocalPosition(5), { source: 'lib1', line: 1 });
            assert.deepEqual(sourceMap.toLocalPosition(9), { source: 'lib2', line: 2 });
            assert.deepEqual(sourceMap.toLocalPosition(17), { source: 'main', line: 2 });
        });
    });

    suite("mapping 3 chunks without debugger; line", () => {

        const sourceLines2 = [
            /* line on server                                                 line on disk                           */
            /*  1                     */ "//# 0 lib2",                     /*                                        */
            /*  2                     */ "//# 0 lib1",                     /*                                        */
            /*  3                     */ "util.out(\">>> in lib1.js\");",  /*  1       util.out(">>> in lib1.js");   */
            /*  4                     */ "var val = 0;",                   /*  2       var val = 0;                  */
            /*  5                     */ "",                               /*  3                                     */
            /*  6                     */ "//# 1 lib2",                     /*  1       //#import "lib1"              */
            /*  7                     */ "util.out(\">>> in lib2.js\");",  /*  2       util.out(">>> in lib2.js");   */
            /*  8                     */ "val = val + 1;",                 /*  3       val = val + 1;                */
            /*  9                     */ "",                               /*  4                                     */
            /* 10                     */ "//# 2 main",                     /*  1       //#import "lib2"              */
            /* 11                     */ "util.out(\">>> in main.js\");",  /*  2       util.out(">>> in main.js");   */
            /* 12                     */ "val = val + 1;",                 /*  3       val = val + 1;                */
            /* 13                     */ "util.out(\">>> val = \" + val);" /*  4       util.out(">>> val = " + val); */
        ];

        test("remote line to local position", () => {
            sourceMap.serverSource = ServerSource.fromSources(sourceLines2);
            sourceMap.setLocalUrls(paths);
            assert.deepEqual(sourceMap.toLocalPosition(1), { source: 'lib1', line: 1 });
            assert.deepEqual(sourceMap.toLocalPosition(3), { source: 'lib1', line: 1 });
            assert.deepEqual(sourceMap.toLocalPosition(4), { source: 'lib1', line: 2 });
            assert.deepEqual(sourceMap.toLocalPosition(7), { source: 'lib2', line: 2 });
            assert.deepEqual(sourceMap.toLocalPosition(12), { source: 'main', line: 3 });
        });

        let tempDir: string;
        const paths: string[] = [];
        const lib1SourceCode =
            /*  1                 */ `util.out(">>> in lib1.js");\n` +
            /*  2                 */ `var val = 0;\n`;

        const lib2SourceCode =
            /*  1                 */ `//#import "lib1"\n` +
            /*  2                 */ `util.out(">>> in lib2.js");\n` +
            /*  3                 */ `val = val + 1;\n`;

        const mainSourceCode =
            /*  1                 */ `//#import "lib2"\n` +
            /*  2                 */ `util.out(">>> in main.js");\n` +
            /*  3                 */ `val = val + 1;\n` +
            /*  4                 */ `util.out(">>> val = " + val);\n`;

        setup(() => {
            tempDir = fs.mkdtempSync(os.tmpdir() + path.sep);

            const writeTestFile = (fileName: string, sourceCode: string) => {
                const p = tempDir + path.sep + fileName;
                const fd = fs.openSync(p, 'w');
                fs.writeFileSync(p, sourceCode);
                paths.push(p);
            };

            writeTestFile('lib1.js', lib1SourceCode);
            writeTestFile('lib2.js', lib2SourceCode);
            writeTestFile('main.js', mainSourceCode);

            sourceMap = new SourceMap();
        });

        teardown(() => {
            paths.forEach(p => fs.unlinkSync(p));
            // Timeout because otherwise we get a ENOTEMPTY in fs.rmdir
            setTimeout(() => { fs.rmdirSync(tempDir); }, 1000);
        });

    });
});
