import * as assert from 'assert';
import * as path from 'path';
import * as procsee from 'process';
import * as serverVersion from '../src/serverVersion';
import { getLatestBuildNo } from '../src/serverVersion';

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
        let version;
        if (buildNo && buildNo !== "") {
            version = serverVersion.getVersion(buildNo);
            if (serverVersion.isLatestVersion(version)) {
                // latest version is default and should not be generated
                version = "";
            }
        }

        const typingsPath = serverVersion.ensurePortalScriptingTSD(extensionPath, outputPath, version);
        const content = fs.readFileSync(typingsPath, 'utf8');
        const ret = content.indexOf("declare namespace context");
        assert.ok(ret > 0, "generated portalScripting.d.ts does not contain 'declare namespace context'");

        const jsdocConfig = path.join(extensionPath, "portalscript", "jsdoc", "jsdoc-config.json");
        fs.removeSync(jsdocConfig);
        fs.removeSync(outputPath);
    });

    test('should not create typings in specific version if they already exist', () => {
        // wherever the tests are started, they are executed
        // in workspace root
        const extensionPath = process.cwd();
        const outputPath = path.join(extensionPath, "test", "typings");
        fs.emptyDirSync(outputPath);
        const outputFile = path.join(outputPath, "portalScripting_50c.d.ts");
        fs.createFileSync(outputFile, "");

        let buildNo;

        buildNo = "#8040";
        let version;
        if (buildNo && buildNo !== "") {
            version = serverVersion.getVersion(buildNo);
            if (serverVersion.isLatestVersion(version)) {
                // latest version is default and should not be generated
                version = "";
            }
        }

        const typingsPath = serverVersion.ensurePortalScriptingTSD(extensionPath, outputPath, version);
        const content = fs.readFileSync(typingsPath, 'utf8');
        assert.ok(content.length === 0, "function overwrites portalScripting_50c.d.ts");

        const jsdocConfig = path.join(extensionPath, "portalscript", "jsdoc", "jsdoc-config.json");
        fs.removeSync(jsdocConfig);
        fs.removeSync(outputPath);
    });

    test('should not create typings in latest version', () => {
        // wherever the tests are started, they are executed
        // in workspace root
        const extensionPath = process.cwd();
        const outputPath = path.join(extensionPath, "test", "typings");
        fs.emptyDirSync(outputPath);
        const outputFile = path.join(outputPath, "portalScripting_50c.d.ts");
        fs.createFileSync(outputFile, "");

        let buildNo;

        buildNo = getLatestBuildNo();
        let version;
        if (buildNo && buildNo !== "") {
            version = serverVersion.getVersion(buildNo);
            if (serverVersion.isLatestVersion(version)) {
                // latest version is default and should not be generated
                version = "";
            }
        }

        // check buildNo
        const no = parseInt(buildNo, 10);
        assert.ok(!isNaN(no), "isNaN failed");
        assert.ok(no > 8000, "buildNo not greater than 8000");

        const typingsPath = serverVersion.ensurePortalScriptingTSD(extensionPath, outputPath, version);

        assert.ok(!fs.existsSync(typingsPath));

        const jsdocConfig = path.join(extensionPath, "portalscript", "jsdoc", "jsdoc-config.json");
        fs.removeSync(jsdocConfig);
        fs.removeSync(outputPath);
    });

    test('typings in specific version should contain corresponding functions', () => {
        // wherever the tests are started, they are executed
        // in workspace root
        const extensionPath = process.cwd();
        const outputPath = path.join(extensionPath, "test", "typings");
        fs.emptyDirSync(outputPath);

        let buildNo;

        buildNo = "#8030"; // 5.0b
        let version;
        if (buildNo && buildNo !== "") {
            version = serverVersion.getVersion(buildNo);
            if (serverVersion.isLatestVersion(version)) {
                // latest version is default and should not be generated
                version = "";
            }
        }

        const typingsPath = serverVersion.ensurePortalScriptingTSD(extensionPath, outputPath, version);
        const content = fs.readFileSync(typingsPath, 'utf8');
        let ret;
        ret = content.indexOf("declare namespace context");
        assert.ok(ret > 0, "generated portalScripting.d.ts does not contain 'declare namespace context'");

        ret = content.indexOf("addPortalScriptCall()");
        assert.ok(ret < 0, "generated portalScripting.d.ts contains 'addPortalScriptCall()'");

        ret = content.indexOf("getAllWorkflowSteps()");
        assert.ok(ret > 0, "generated portalScripting.d.ts does not contain 'getAllWorkflowSteps()'");

        const jsdocConfig = path.join(extensionPath, "portalscript", "jsdoc", "jsdoc-config.json");
        fs.removeSync(jsdocConfig);
        fs.removeSync(outputPath);
    });

    test('should return the correct version to given build number', () => {
        let buildNo;
        let version;
        let latest;

        buildNo = "#8012";
        version = serverVersion.getVersion(buildNo);
        latest = serverVersion.isLatestVersion(version);
        assert.equal(version, "");
        assert.equal(latest, false);

        buildNo = "#8025";
        version = serverVersion.getVersion(buildNo);
        latest = serverVersion.isLatestVersion(version);
        assert.equal(version, "5.0a HF1");
        assert.equal(latest, false);

        buildNo = "#8045";
        version = serverVersion.getVersion(buildNo);
        latest = serverVersion.isLatestVersion(version);
        assert.equal(version, "5.0c HF1");

        buildNo = "unknown";
        version = serverVersion.getVersion(buildNo);
        latest = serverVersion.isLatestVersion(version);
        assert.equal(version, "");
        assert.equal(latest, false);
    });

    test('should return true if string is available version', () => {

        let ret;
        ret = serverVersion.isVersion("5.0b HF1");
        assert.equal(ret, true);

        ret = serverVersion.isVersion("unknown");
        assert.equal(ret, false);
    });

});
