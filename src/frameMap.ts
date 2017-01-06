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
        frames.forEach(frame => {
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

    /**
     * Returns the current stackframe from a given context be returning the frame with the lowest depth.
     * @param {number} contextId - Context id
     * @returns {StackFrame|undefined} The current stackframe or undefined if no stackframe for this context is saved.
     */
    public getCurrentStackFrame(contextId: number): StackFrame | undefined {
        let stackframes = this.getStackFramesFromContext(contextId).sort((a: StackFrame, b: StackFrame) => {
            return a.rDepth - b.rDepth;
        });

        if (stackframes.length > 0) {
            // The first stackframe is the current one (because it's depth is the lowest one)
            return stackframes[0];
        } else {
            // No stackframe found for this context
            return undefined;
        }
    }

    /**
     * Returns all stackframes from a given context.
     * @param {number} contextId - Context id to match
     * @returns {Array.<StackFrame>} An array with every stackframe from a given context.
     */
    public getStackFramesFromContext(contextId): StackFrame[] {
        let stackframes: StackFrame[] = [];

        this.frameIdToFrame.forEach((frame: StackFrame) => {
            if (reverseCantorPairing(frame.frameId).x === contextId) {
                stackframes.push(frame);
            }
        });

        return stackframes;
    }
}
