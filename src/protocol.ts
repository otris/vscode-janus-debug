'use strict';

import * as assert from 'assert';
import * as uuid from 'node-uuid';

export type CommandName = 'pc' | 'step' | 'next' | 'continue' | 'source_code' | 'delete_all_breakpoints' | 'pause' | 'set_breakpoint' | 'get_stacktrace' | 'get_variables' | 'evaluate' | 'get_all_source_urls' | 'get_breakpoints' | 'get_available_contexts' | 'exit';

export type ResponseType = 'info' | 'error';

export type ResponseSubType = 'pc' | 'source_code' | 'all_breakpoints_deleted' | 'breakpoint_set' | 'breakpoint_deleted' | 'stacktrace' | 'variables' | 'evaluated' | 'all_source_urls' | 'breakpoints_list' | 'contexts_list';

export interface Response {
    /** Tyep of the response: 'info' for normal responses, 'error' for errors. */
    type: ResponseType;
    /** Actual content of a response. */
    content: any;
    /** Name of the response. */
    subtype?: ResponseSubType;
    /** Optional numerical identifier of the JSContext in question. */
    contextId?: number;
}

export function parseResponse(responseString: string): Response {
    let contextId: number = undefined;
    let indexStart = 0;
    const match = responseString.match(/^([0-9]+)\/{/);
    if (match) {
        contextId = Number.parseInt(match[1]);
        assert.ok(!Number.isNaN(contextId), 'could not parse context id');
        indexStart = match[0].length - 1;
    }
    let obj = JSON.parse(responseString.substring(indexStart));
    let response: Response = {
        type: obj.type,
        content: {}
    };
    delete obj.type;
    if (contextId !== undefined) {
        response['contextId'] = contextId;
    }
    if (obj.subtype) {
        response['subtype'] = obj.subtype;
        delete obj.subtype;
    }
    response.content = obj;
    return response;
}

export class Command {
    public type: string;
    public id: string;

    constructor(public name: CommandName) {
        this.type = 'command';
        this.id = uuid.v4();
    }

    public serialize(contextId?: number): string {
        if (contextId) {
            return `${contextId}/${JSON.stringify(this)}\n`;
        } else {
            return `${JSON.stringify(this)}\n`;
        }
    }
}

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