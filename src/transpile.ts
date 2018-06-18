import * as nodeDoc from 'node-documents-scripting';
import * as os from 'os';
import * as path from 'path';
import * as ts from 'typescript';
import * as vscode from 'vscode';
import * as helpers from './helpers';
// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

// todo: line-endings are only LF


// todo: move to node-documents-scripting
function fixPortalScript(destSource: string) {
    destSource = destSource.replace(/require\(["'](.*\/(.*))["']\)/g, `require( /*("$1")*/ "$2")`);
    destSource = destSource.replace(/.*__esModule.*/, 'context.enableModules();');

    if (destSource.indexOf('returnCode') >= 0) {
        destSource = destSource + '\n\nreturn returnCode;\n';
    }

    return destSource;
}

// todo: move to node-documents-scripting
function jsonToConfig(tsConfigFile: string): ts.CompilerOptions {
    const options: ts.CompilerOptions = ts.getDefaultCompilerOptions();

    // read configuration from tsconfig.json
    // const jsonContent = fs.readFileSync(tsConfigFile, 'utf8');
    // const jsonObject = JSON.parse(jsonContent);
    // jsonObject.compilerOptions.target: "es5"
    // jsonObject.compilerOptions.noLib: true
    // options.baseUrl = scriptDir;

    options.target = ts.ScriptTarget.ES5;
    options.noLib = true;
    options.newLine = ts.NewLineKind.LineFeed;
    options.project = tsConfigFile;

    return options;
}



// todo: move to node-documents-scripting
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
    return ts.transpileModule(script.localCode, tOptions);
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

            // check transpilation result
            if (result.diagnostics && result.diagnostics.length !== 0) {

                // transpiler errors happened, try to output file, line and pos
                result.diagnostics.forEach(d => {
                    if (d.file && d.start) {
                        // maybe add d.length
                        const start = d.file.getLineAndCharacterOfPosition(d.start);
                        console.log(d.messageText + ': ' + d.file.fileName + ': ' + (start.line + 1) + ':' + (start.character + 1));
                        vscode.window.showErrorMessage(`Transpilation of ${script.name}.ts failed at line ${start.line + 1}: pos ${start.character}`);
                    } else {
                        console.log(d.messageText + (d.file ? (': ' + d.file.fileName) : ''));
                        vscode.window.showErrorMessage(`Transpilation of ${script.name}.ts failed`);
                    }
                });
                vscode.window.setStatusBarMessage(`Generation of PortalScript ${script.name} failed`);
            } else {

                // everything fine, add required code changes and save the script
                // todo: clear former ErrorMessages
                const jsSource = fixPortalScript(result.outputText);
                fs.writeFileSync(path.join(path.dirname(script.path), script.name + '.js'), jsSource, 'utf-8');
                vscode.window.setStatusBarMessage(`Generated PortalScript ${script.name} at ${helpers.getTime()}`);
            }


        } catch (e) {
            return reject('error in generating portalScript: ' + e);
        }

        return resolve();
    });
}
