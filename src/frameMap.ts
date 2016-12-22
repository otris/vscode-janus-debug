'use strict';

import { cantorPairing, reverseCantorPairing } from './cantor';
import { ContextId } from './context';
import { Logger } from './log';
import * as protocol from './protocol';

/**
 * VS Code identifier for a stack frame.
 *
 * Must be unique across all threads. Used to retrieve the scopes of the frame within
 * the 'scopesRequest'.
 */
export type FrameId = number;

class StackFrame {

    public readonly frameId: FrameId;
    public readonly rDepth: number;
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
    private frameIdToFrame: Map<FrameId, StackFrame> = new Map();

    public addFrames(contextId: ContextId, frames: protocol.StackFrame[]): StackFrame[] {
        log.debug(`adding frames ${JSON.stringify(frames)} for context id ${contextId}`);

        let added: StackFrame[] = [];
        frames.forEach((frame) => {
            let entry = new StackFrame(contextId, frame);
            if (this.frameIdToFrame.has(entry.frameId)) {
                log.warn(`already mapped entry: ${entry.frameId} -> (${contextId}, ${entry.rDepth})`);
            }
            this.frameIdToFrame.set(entry.frameId, entry);
            added.push(entry);
        });
        return added;
    }

    public getStackFrame(frameId: FrameId): StackFrame {
        let frame = this.frameIdToFrame.get(frameId);
        if (frame === undefined) {
            throw new Error(`No such frame ${frameId}`);
        }
        return frame;
    }
}
