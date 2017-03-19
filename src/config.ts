'use strict';

import * as fs from 'fs';
import { isAbsolute, join } from 'path';
import { DebugProtocol } from 'vscode-debugprotocol';
import { LogConfiguration } from './log';

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
}

/**
 * Get 'main' property from given package.json if there is a such a property in that file.
 *
 * @param packageJsonPath {string} The absolut path to the package.json file
 */
export function parseEntryPoint(packageJsonPath: string): string | undefined {
    let entryPoint: string | undefined = undefined;

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
