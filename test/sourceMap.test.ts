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
        /* line on server                                              file/line */
        /*  1 not visible to user */ "debugger;",
        /*  2                     */ "//# 0 lib",                      /* lib.js   */
        /*  3                     */ "var x=1;",                       /*  1       */
        /*  4                     */ "x=2;",                           /*  2       */
        /*  5                     */ "util.out(\"lib.js: \" + x);",    /*  3       */
        /*  6                     */ "a.push(\"0\");",                 /*  4       */
        /*  7                     */ "",                               /*  5       */
        /*  8                     */ "//# 2 test1",                    /* test1.js */
        /*  9                     */ "",                               /*  1       */
        /* 10                     */ "a.push(\"1\");",                 /*  2       */
        /* 11                     */ "a.push(\"2\");",                 /*  3       */
        /* 12                     */ "a.push(\"3\");",                 /*  4       */
        /* 13                     */ "a.push(\"4\");",                 /*  5       */
        /* 14                     */ "util.out(\"Done\");"             /*  6       */
    ];

    const sourceLines2 = [
        /* line on server                                              file/line */
        /*  1 not visible to user */ "debugger;",
        /*  2                     */ "//# 0 lib",                        /* lib.js   */
        /*  3                     */ "var x = 1;",                       /*  1       */
        /*  4                     */ "x = 2;",                           /*  2       */
        /*  5                     */ "util.out(\"lib.js: \" + x);",      /*  3       */
        /*  6                     */ "//enumval.push(\"0\");",           /*  4       */
        /*  7                     */ "var add = function(a, b) {",       /*  5       */
        /*  8                     */ "    return a + b;",                /*  6       */
        /*  9                     */ "};",                               /*  7       */
        /* 10                     */ "",                                 /*  8       */
        /* 11                     */ "//# 2 test1",                      /* test1.js */
        /* 12                     */ "",                                 /*  1       //#import "lib"                */
        /* 13                     */ "// enumval.push(\"1\");",          /*  2                                      */
        /* 14                     */ "// enumval.push(\"2\");",          /*  3       // enumval.push("1");          */
        /* 15                     */ "// enumval.push(\"3\");",          /*  4       // enumval.push("2");          */
        /* 16                     */ "// enumval.push(\"4\");",          /*  5       // enumval.push("3");          */
        /* 17                     */ "var result = add(7, 3);",          /*  6       // enumval.push("4");          */
        /* 18                     */ "util.out(\"result: \" + result);", /*  7       var result = add(7, 3);        */
        /* 19                     */ "util.out(\"Done\");"               /*  8       util.out("result: " + result); */
                                                                         /*  9       util.out("Done");              */
                                                                         /* 10                                      */
    ];

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

    suite("mapping", () => {

        let tempDir: string;
        const paths: string[] = [];
        const libSourceCode =
            /*  1                 */ "var x=1;\n" +
            /*  2                 */ "x=2;\n" +
            /*  3                 */ "util.out(\"lib.js: \" + x);\n" +
            /*  4                 */ "a.push(\"0\");\n" +
            /*  5                 */ "";
        const test1SourceCode =
            /*  1                 */ "\n" +
            /*  2                 */ "a.push(\"1\");\n" +
            /*  3                 */ "a.push(\"2\");\n" +
            /*  4                 */ "a.push(\"3\");\n" +
            /*  5                 */ "a.push(\"4\");\n" +
            /*  6                 */ "util.out(\"Done\");";

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
            assert.deepEqual(sourceMap.toLocalPosition(6), { source: 'lib', line: 4 });
        });
    });

    suite('server source', () => {

        test("parse pre-processor comment line", () => {
            const lines = [
                "//# 0 Gadget_appConnectOfflineApp",
                "//# 1 UPPERCASE",
                "//# 2 appAddToFavorites",
                "//# 3 appAdditional.Settings",
                "  //# 4 appCall_INIT  ",
                "//# 9 appConfigImportExportLibrary",
                "//# 10 appConfigImporter",
                "//# 11 appConfigJumpBackToMain",
                "//# 16 appFileConfig_Importer",
                "//# 17 appFileConfig_getAutoRank",
                "//# 18 appFileTypeEnum",
                "//# 19 appFoldersEnum",
                " //# 20 appLinkRegistersEnum",
                "	//# 21 appListConfig_Exporter",
                "//# 25 appMainConfig_OnDelete",
                "//# 26 appMainConfig_OnSave",
                "//# 28 .appMarkAsRead",
                "//# 29 appPerformWorkflowAction",
                "//# 32 crmAccount_MailSent#",
                "//# 33 crmAccount_TransferAddressToContacts",
                "//# 34 crmAccount_onDelete#",
                "//# 35 crmAppointment_New  ",
                "//# 36 crmCampaign_FillMultipleVeryLongLines#",
            ];
            const s = ServerSource.fromSources(lines);
            assert.equal(s.chunks.length, 23);
        });

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
