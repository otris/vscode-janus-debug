'use strict';

import * as assert from 'assert';
import * as uuid from 'uuid';
import { DebugProtocol } from 'vscode-debugprotocol';

export enum ErrorCode {
    UNKNOWN_COMMAND = 1,
    NO_COMMAND_NAME = 2,
    NOT_A_COMMAND_PACKAGE = 3,
    NOT_PAUSED = 4,
    BAD_ARGS = 5,
    SCRIPT_NOT_FOUND = 6,
    CANNOT_SET_BREAKPOINT = 8,
    IS_PAUSED = 9,
    UNEXPECTED_EXC = 10,
    EVALUATION_FAILED = 11,
    PC_NOT_AVAILABLE = 12,
    NO_ACTIVE_FRAME = 13,
}

export type CommandName =
    'server_version' |
    'pc' |
    'step' |
    'next' |
    'step_out' |
    'continue' |
    'get_source' |
    'delete_all_breakpoints' |
    'pause' |
    'set_breakpoint' |
    'stop' |
    'get_stacktrace' |
    'get_variables' |
    'evaluate' |
    'get_all_source_urls' |
    'get_breakpoints' |
    'get_available_contexts' |
    'exit';

export type ResponseType = 'info' | 'error';

export type ResponseSubType =
    'server_version' |
    'pc' |
    'source_code' |
    'all_breakpoints_deleted' |
    'breakpoint_set' |
    'breakpoint_deleted' |
    'stacktrace' |
    'variables' |
    'evaluated' |
    'all_source_urls' |
    'breakpoints_list' |
    'contexts_list' |
    'paused';

export interface Response {
    /** Type of the response: 'info' for normal responses, 'error' for errors. */
    type: ResponseType;
    /** Actual content of a response. */
    content: any;
    /** Name of the response. */
    subtype?: ResponseSubType;
    /** Optional numerical identifier of the JSContext in question. */
    contextId?: number;
}

export interface Query {
    depth: number;
    options?: object;
}

export interface Breakpoint {
    bid: number;
    url: string;
    line: number;
    pending: boolean;
}

export interface StackFrame {
    url: string;
    line: number;
    rDepth: number;
}

export type VariableValue = '___jsrdbg_undefined___' | any;

export interface Variable {
    name: string;
    value: VariableValue;
    type?: string;
}

export interface Evaluate {
    path: string;
    options?: object;
}

export function variableValueToString(value: VariableValue): string {
    if (typeof value === 'string') {
        if (value === '___jsrdbg_undefined___') {
            return 'undefined';
        }
    } else {

        // Functions

        if (value.hasOwnProperty('___jsrdbg_function_desc___')) {
            assert.ok(value.___jsrdbg_function_desc___.hasOwnProperty('parameterNames'));
            const parameterNames: string[] = value.___jsrdbg_function_desc___.parameterNames;
            const parameters = parameterNames.join(', ');
            return `function (${parameters}) { … }`;
        }

        // Arrays

        if (value.hasOwnProperty('length')) {
            const length = value.length;
            return `Array[${length}] []`;
        }
    }
    return value.toString();
}

export function parseResponse(responseString: string): Response {
    let contextId: number | undefined;
    let indexStart = 0;
    const match = responseString.match(/^([0-9]+)\/{/);
    if (match) {
        contextId = Number.parseInt(match[1]);
        assert.ok(!Number.isNaN(contextId), 'could not parse context id');
        indexStart = match[0].length - 1;
    }
    const obj = JSON.parse(responseString.substring(indexStart));
    const response: Response = {
        content: {},
        type: obj.type,
    };
    delete obj.type;
    if (contextId !== undefined) {
        response.contextId = contextId;
    }
    if (obj.subtype) {
        response.subtype = obj.subtype;
        delete obj.subtype;
    }
    response.content = obj;
    return response;
}

export class Command {

    public static setBreakpoint(url: string, lineNumber: number, pending?: boolean, contextId?: number): Command {
        const cmd = new Command('set_breakpoint', contextId);
        cmd.payload.breakpoint = {
            line: lineNumber,
            pending: pending === undefined ? true : pending,
            url,
        };
        return cmd;
    }

    public static getSource(url: string): Command {
        const cmd = new Command('get_source');
        cmd.payload.url = url;
        return cmd;
    }

    public static getVariables(contextId: number, query: Query): Command {
        const cmd = new Command('get_variables', contextId);
        cmd.payload.query = query;
        return cmd;
    }

    public static evaluate(contextId: number, evaluate: Evaluate): Command {
        const cmd = new Command('evaluate', contextId);
        cmd.payload.path = evaluate.path;
        cmd.payload.options = evaluate.options;
        return cmd;
    }

    private payload: any;
    private contextId: number | undefined;

    public get name(): CommandName { return this.payload.name; }
    public get type(): string { return this.payload.type; }
    public get id(): string { return this.payload.id; }

    constructor(name: CommandName, contextId?: number) {
        this.payload = {
            name,
            type: 'command',
        };
        this.contextId = contextId;

        // Only commands that expect a response need an id. For example, 'exit' does not entail a
        // response from the server so we do not need to generate a UUID v4 for this command.

        let needsId = true;
        const exceptions = [
            () => name === 'get_available_contexts',
            () => name === 'exit',
            () => name === 'continue' && contextId === undefined,
            () => name === 'next',
            () => name === 'stop',
        ];
        for (const exception of exceptions) {
            if (exception()) {
                needsId = false;
                break;
            }
        }
        if (needsId) {
            this.payload.id = uuid.v4();
        }
    }

    public toString(): string {
        if (this.name === 'get_available_contexts') {
            return 'get_available_contexts\n';
        }
        if (this.name === 'server_version') {
            return `server_version/${this.id}\n`;
        }
        if (this.name === 'exit') {
            return 'exit\n';
        }
        if ((this.name === 'continue') && !this.contextId) {
            return '{"type":"command","name":"continue"}\n';
        }
        if (this.contextId) {
            return `${this.contextId}/${JSON.stringify(this.payload)}\n`;
        }
        return `${JSON.stringify(this.payload)}\n`;
    }
}
