'use strict';

import { DebugSession, InitializedEvent } from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { CommonArguments, AttachRequestArguments } from './config';
import { Logger } from './log';

let sessionLog = Logger.create('SpiderMonkeyDebugSession');

export class SpiderMonkeyDebugSession extends DebugSession {
    public constructor() {
        sessionLog.debug("constructor");
        super();
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse,
        args: DebugProtocol.InitializeRequestArguments): void {
        sessionLog.debug("initializeRequest");

        // Since this debug adapter can accept configuration requests like 'setBreakpoint' at any
        // time, we request them early by sending an 'initializeRequest' to the frontend. The
        // frontend will end the configuration sequence by calling 'configurationDone' request.
        this.sendEvent(new InitializedEvent());

        response.body.supportsConfigurationDoneRequest = false;
        this.sendResponse(response);
    }

    protected disconnectRequest(response: DebugProtocol.DisconnectResponse,
        args: DebugProtocol.DisconnectArguments): void {
        sessionLog.debug("disconnectRequest");
        this.sendResponse(response);
    }

    /*
        Not supported:

        protected launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments): void;
    */

    protected attachRequest(response: DebugProtocol.AttachResponse,
        args: AttachRequestArguments): void {
        this.readConfig(args);
        sessionLog.debug("attachRequest");
        this.sendResponse(response);
    }

    protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse,
        args: DebugProtocol.SetBreakpointsArguments): void {
        sessionLog.debug(
            `setBreakPointsRequest with ${args.breakpoints.length} breakpoint(s) for ${args.source.path}`);
        this.sendResponse(response);
    }

    protected setFunctionBreakPointsRequest(response: DebugProtocol.SetFunctionBreakpointsResponse,
        args: DebugProtocol.SetFunctionBreakpointsArguments): void {
        sessionLog.debug("setFunctionBreakPointsRequest");
        this.sendResponse(response);
    }

    /*
        protected setExceptionBreakPointsRequest(response: DebugProtocol.SetExceptionBreakpointsResponse, args: DebugProtocol.SetExceptionBreakpointsArguments): void;
        protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments): void;
        protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void;
        protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void;
        protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): void;
        protected stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments): void;
        protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments): void;
        protected restartFrameRequest(response: DebugProtocol.RestartFrameResponse, args: DebugProtocol.RestartFrameArguments): void;
        protected gotoRequest(response: DebugProtocol.GotoResponse, args: DebugProtocol.GotoArguments): void;
        protected pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments): void;
        protected sourceRequest(response: DebugProtocol.SourceResponse, args: DebugProtocol.SourceArguments): void;
        protected threadsRequest(response: DebugProtocol.ThreadsResponse): void;
        protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void;
        protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void;
        protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): void;
        protected setVariableRequest(response: DebugProtocol.SetVariableResponse, args: DebugProtocol.SetVariableArguments): void;
        protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): void;
        protected stepInTargetsRequest(response: DebugProtocol.StepInTargetsResponse, args: DebugProtocol.StepInTargetsArguments): void;
        protected gotoTargetsRequest(response: DebugProtocol.GotoTargetsResponse, args: DebugProtocol.GotoTargetsArguments): void;
        protected completionsRequest(response: DebugProtocol.CompletionsResponse, args: DebugProtocol.CompletionsArguments): void;
    */

    private readConfig(args: CommonArguments): void {
        if (args.log) {
            Logger.config = args.log;
        }
    }
}

DebugSession.run(SpiderMonkeyDebugSession);
