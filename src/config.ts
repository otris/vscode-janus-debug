'use strict';

import * as fs from 'fs';
import { LogConfiguration } from 'node-file-log';
import { isAbsolute, join } from 'path';
import * as vscode from 'vscode';
import { DebugProtocol } from 'vscode-debugprotocol';
import { getVersion } from './version';

export interface CommonArguments {
    /** The debugger port to attach to. */
    debuggerPort: number;
    /** The IP address of the host where the application runs on. */
    host: string;
    /** Lets you configure diagnostic logging of the debug adapter. */
    log: LogConfiguration;
    /** Time in ms until we give up trying to connect. */
    timeout: number;
}

export interface AttachRequestArguments extends DebugProtocol.AttachRequestArguments,
    CommonArguments {
}

/**
 * Arguments needed for a launch request.
 *
 * These are the arguments needed when we want to launch a script on the server.
 */
export interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments,
    CommonArguments {
    /** The application port to attach to. */
    applicationPort: number;
    /** A username. The script is executed in the context of this user. */
    username: string;
    /** Your user's client affiliation if there is one. */
    principal?: string;
    /** The user's password. */
    password: string;
    /** The script that is executed on the server. */
    script: string;
    /** Automatically stop target after launching. If not specified, target does not stop. */
    stopOnEntry?: boolean;

    /** Whether the remote server is a DOCUMENTS server. */
    portal?: boolean;
}

export const commandAskForPassword = '${command:extension.vscode-janus-debug.askForPassword}';

const initialConfigurations = [
    {
        name: 'Launch Script on Server',
        request: 'launch',
        type: 'janus',
        script: '',
        username: '',
        password: commandAskForPassword,
        principal: '',
        host: 'localhost',
        applicationPort: 10000,
        debuggerPort: 8089,
        currentConfiguration: true,
        stopOnEntry: true,
        log: {
            fileName: '${workspaceRoot}/vscode-janus-debug-launch.log',
            logLevel: {
                default: 'Debug',
            },
        },
        timeout: 6000
    },
    {
        name: 'Attach to Server',
        request: 'attach',
        type: 'janus',
        host: 'localhost',
        debuggerPort: 8089,
        log: {
            fileName: '${workspaceRoot}/vscode-janus-debug-attach.log',
            logLevel: {
                default: 'Debug',
            },
        },
        timeout: 6000
    },
];

/**
 * Get 'main' property from given package.json if there is a such a property in that file.
 *
 * @param packageJsonPath {string} The absolute path to the package.json file
 */
export function parseEntryPoint(packageJsonPath: string): string | undefined {
    let entryPoint: string | undefined;

    try {
        const jsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const jsonObject = JSON.parse(jsonContent);
        if (jsonObject.main) {
            entryPoint = jsonObject.main;
        } else if (jsonObject.scripts && typeof jsonObject.scripts.start === 'string') {
            entryPoint = jsonObject.scripts.start.split(' ').pop();
        }

        if (entryPoint !== undefined) {
            entryPoint = isAbsolute(entryPoint) ? entryPoint : join('${workspaceRoot}', entryPoint);
        }
    } catch (err) {
        // Silently ignore any error. We need to provide an initial configuration whether we have found the
        // main entry point or not.
    }

    return entryPoint;
}

/**
 * Creates and returns the initial debugger configurations.
 *
 * @param {string} [workspaceRootPath] The folder that is open in VS Code. Optional.
 * @param {*} [overwrites] An optional set of properties to include in the resulting config.
 * @returns {vscode.DebugConfiguration[]} The configurations.
 */
export function provideInitialConfigurations(workspaceRootPath?: string,
                                             overwrites?: any): vscode.DebugConfiguration[] {
    // Get 'main' property from package.json iff there is a package.json. This is probably the primary entry
    // point for the program and we use it to set the "script" property in our initial configurations.

    if (workspaceRootPath) {
        // A folder is open in VS Code
        const packageJsonPath = join(workspaceRootPath, 'package.json');
        const entryPoint = parseEntryPoint(packageJsonPath);
        if (entryPoint) {
            initialConfigurations.forEach((config: any) => {
                if (config.hasOwnProperty('script')) {
                    config.script = entryPoint;
                }
            });
        }
    }

    if (overwrites) {
        initialConfigurations.forEach((config: any) => {
            Object.keys(overwrites).forEach(key => {
                if (config[key] !== undefined) {
                    config[key] = overwrites[key];
                }
            });
        });
    }

    return initialConfigurations;
}

/**
 * Returns a complete new launch.json as string.
 *
 * @param {string} [workspaceRootPath] The folder that is open in VS Code. Optional.
 * @param {*} [overwrites] An optional set of properties to include in the resulting config.
 * @returns {string} The contents of the launch.json file.
 */
export function launchJsonString(workspaceRootPath?: string, overwrites?: any): string {
    const configurations = JSON.stringify(
        provideInitialConfigurations(workspaceRootPath, overwrites), null, '\t')
        .split('\n').map(line => '\t' + line).join('\n').trim();

    return [
        '{',
        '\t// Use IntelliSense to learn about possible configuration attributes.',
        '\t// Hover to view descriptions of existing attributes.',
        '\t// For more information, visit',
        '\t// https://github.com/otris/vscode-janus-debug/wiki/Launching-the-Debugger',
        '\t"version": "' + getVersion().toString() + '",',
        '\t"configurations": ' + configurations,
        '}',
    ].join('\n');
}
