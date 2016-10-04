'use strict';

import { ContextId } from './context';
import * as protocol from './protocol';
import { cantorPairing, reverseCantorPairing } from './cantor';
import { Logger } from './log';

/** VS Code identifier for a stack frame. Must be unique across all threads. Used to retrieve the scopes of the
 * frame within the 'scopesRequest'. */
export type FrameId = number;

class StackFrame {

    public readonly frameId: FrameId;
    public readonly rDepth: number
    public readonly sourceLine: number;
    public readonly sourceUrl: string;

    constructor(public readonly contextId: ContextId, frame: protocol.StackFrame) {
        this.frameId = cantorPairing(contextId, frame.rDepth);
        this.rDepth = frame.rDepth;
        this.sourceLine = frame.line;
        this.sourceUrl = frame.url;
    }
}

let log = Logger.create('FrameMap');

export class FrameMap {
    private frameIdToFrame: Map<FrameId, StackFrame>;

    public addFrames(contextId: ContextId, frames: protocol.StackFrame[]): StackFrame[] {
        log.debug(`adding frames ${JSON.stringify(frames)} for context id ${contextId}`);

        let added: StackFrame[] = [];
        frames.forEach(frame => {
            let entry = new StackFrame(contextId, frame);
            if (this.frameIdToFrame.has(entry.frameId)) {
                log.info(`already mapped entry: ${entry.frameId} -> (${contextId}, ${entry.rDepth})`);
            }
            this.frameIdToFrame.set(entry.frameId, entry);
            added.push(entry);
        });
        return added;
    }

    public getStackFrame(frameId: FrameId): StackFrame | undefined {
        return this.frameIdToFrame.get(frameId);
    }
}