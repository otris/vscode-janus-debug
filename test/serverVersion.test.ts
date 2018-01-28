import * as assert from 'assert';
import * as path from 'path';
import * as procsee from 'process';
import * as serverVersion from '../src/serverVersion';

// tslint:disable-next-line:no-var-requires
const fs = require("fs-extra");

suite('server version tests', () => {
    test('should create typings in specific version', () => {
        // wherever the tests are started, they are executed
        // in workspace root
        const extensionPath = process.cwd();
        const outputPath = path.join(extensionPath, "test", "typings");
        fs.emptyDirSync(outputPath);

        let buildNo;

        buildNo = "#8040";

        const typingsPath = serverVersion.ensurePortalScriptingTSD(extensionPath, outputPath, buildNo);
        const content = fs.readFileSync(typingsPath, 'utf8');
        const ret = content.indexOf("declare namespace context");
        assert.ok(ret > 0, "generated portalScripting.d.ts does not contain 'declare namespace context'");

        fs.emptyDirSync(outputPath);
    });

    test('should not create typings if the file exists', () => {
        // wherever the tests are started, they are executed
        // in workspace root
        const extensionPath = process.cwd();
        const outputPath = path.join(extensionPath, "test", "typings");
        fs.emptyDirSync(outputPath);
        const outputFile = path.join(outputPath, "portalScripting_50c.d.ts");
        fs.createFileSync(outputFile, "");

        let buildNo;

        buildNo = "#8040";

        const typingsPath = serverVersion.ensurePortalScriptingTSD(extensionPath, outputPath, buildNo);
        const content = fs.readFileSync(typingsPath, 'utf8');
        assert.ok(content.length === 0, "function overwrites portalScripting_50c.d.ts");

        fs.emptyDirSync(outputPath);
    });

    test('should return the correct version of a build number', () => {
        let buildNo;
        let version;
        let latest;

        buildNo = "#8012";
        version = serverVersion.getVersion(buildNo);
        latest = serverVersion.isLatestVersion(version);
        assert.equal(version, "");
        assert.equal(latest, false);

        buildNo = "#8045";
        version = serverVersion.getVersion(buildNo);
        latest = serverVersion.isLatestVersion(version);
        assert.equal(version, "5.0c HF1");
        assert.equal(latest, true);

        buildNo = "unknown";
        version = serverVersion.getVersion(buildNo);
        latest = serverVersion.isLatestVersion(version);
        assert.equal(version, "");
        assert.equal(latest, false);
    });
});
