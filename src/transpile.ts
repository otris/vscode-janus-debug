import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as ts from 'typescript';
import * as vscode from 'vscode';
import * as helpers from './helpers';
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

// todo: line-endings are only LF


// typescript output channel

const scriptChannel: vscode.OutputChannel = vscode.window.createOutputChannel('Typescript Console');
function consoleLog(msg: any) {
    scriptChannel.appendLine(String(msg));
    scriptChannel.show();
}
function consoleRemove() {
    scriptChannel.hide();
    scriptChannel.dispose();
}

// typescript diagnostic collection

const visibleDiagnostics = vscode.languages.createDiagnosticCollection('typescript');
function clearDiagnostics(uri?: vscode.Uri) {
    if (uri) {
        visibleDiagnostics.delete(uri);
    } else {
        visibleDiagnostics.clear();
    }
}

/**
 * Convert typescript diagnostics to vscode diagnostics and
 * make them visible in vscode editor and problems window
 *
 * @param tsDiagnostics the typescript diagnostics
 * @param fileName the filename
 */
function setDiagnostics(tsDiagnostics: ts.Diagnostic[] | undefined, fileName?: string): void {
    const vscDiagnostics: vscode.Diagnostic[] = [];

    if (tsDiagnostics && tsDiagnostics.length > 0) {
        tsDiagnostics.forEach(d => {
            let range;
            if (d.file && d.start && d.length) {
                const start = d.file.getLineAndCharacterOfPosition(d.start);
                const end = d.file.getLineAndCharacterOfPosition(d.start + d.length);
                range = new vscode.Range(start.line, start.character, end.line, end.character);
                consoleLog(d.messageText + ': ' + (d.file ? d.file.fileName : '') + ':' + (start.line + 1) + ':' + (start.character + 1));
            } else {
                range = new vscode.Range(0, 0, 0, 0);
                consoleLog(d.messageText + ': ' + (d.file ? d.file.fileName : ''));
            }
            vscDiagnostics.push({
                code: '',
                message: "[PortalScript] " + d.messageText.toString(),
                // tslint:disable-next-line:object-literal-shorthand
                range: range,
                severity: vscode.DiagnosticSeverity.Error,
                source: ''
            });
        });
        visibleDiagnostics.set(vscode.Uri.file(fileName ? fileName : ''), vscDiagnostics);
    } else {
        clearDiagnostics(fileName ? vscode.Uri.file(fileName) : undefined);
    }
}



function fixPortalScript(source: string) {
    source = source.replace(/require\(["'](.*\/(.*))["']\)/g, `require( /*("$1")*/ "$2")`);
    source = source.replace(/.*__esModule.*/, 'context.enableModules();');

    if (source.indexOf('returnCode') >= 0) {
        source = source + '\n\nreturn returnCode;\n';
    }

    return source;
}

/**
 * tsconfig.json -> ts.CompilerOptions
 *
 * @param tsConfigFile path to tsconfig.json
 */
function jsonToConfig(tsConfigFile: string): ts.CompilerOptions {
    const json = JSON.parse(fs.readFileSync(tsConfigFile, "utf-8"));
    const result = ts.convertCompilerOptionsFromJson(json.compilerOptions, path.dirname(tsConfigFile), path.basename(tsConfigFile));
    setDiagnostics(result.errors);
    return result.options;
}







function transpileScript(script: nodeDoc.scriptT, tsConfigFile: string): ts.TranspileOutput {
    if (!script.localCode) {
        throw new Error('Script source code missing');
    }

    // set options and transpile...
    const cOptions: ts.CompilerOptions = jsonToConfig(tsConfigFile);
    const tOptions: ts.TranspileOptions = {
        fileName: script.path,
        reportDiagnostics: true,
        compilerOptions: cOptions
    };
    const result = ts.transpileModule(script.localCode, tOptions);

    // output compile errors
    setDiagnostics(result.diagnostics, script.path);


    return result;
}




export function generatePortalScript(param: any): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        let tsConfig;
        const script = await helpers.ensureScript(param, '.ts');
        if (!vscode.workspace || !vscode.workspace.workspaceFolders) {
            return reject('Workspace folder requiered for this command');
        }
        if (!script.path) {
            return reject('script path is missing');
        }

        // the workspace root of the script should contain a tsconfig.json file
        for (const folder of vscode.workspace.workspaceFolders) {
            const wsFolder = folder.uri.fsPath;
            const tmpConfig = path.join(wsFolder, 'tsconfig.json');
            if (script.path.startsWith(wsFolder) && fs.existsSync(tmpConfig)) {
                tsConfig = tmpConfig;
                break;
            }
        }
        if (!tsConfig) {
            return reject('tsconfig.json required in root path');
        }

        try {
            // generate portalScript

            // first transpile the code
            const result = transpileScript(script, tsConfig);

            const jsSource = fixPortalScript(result.outputText);
            fs.writeFileSync(path.join(path.dirname(script.path), script.name + '.js'), jsSource, 'utf-8');

            vscode.window.setStatusBarMessage(`Generated PortalScript ${script.name} at ${helpers.getTime()}`);

        } catch (e) {
            return reject('error in generating portalScript: ' + e);
        }

        return resolve();
    });
}
