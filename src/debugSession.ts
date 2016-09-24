'use strict';

import * as assert from 'assert';
import { connect, Socket } from 'net';
import { DebugSession, InitializedEvent, StoppedEvent, ContinuedEvent } from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { CommonArguments, AttachRequestArguments } from './config';
import { DebugConnection } from './connection';
import { Command, Response } from './protocol';
import { ContextId } from './context';
import { Logger } from './log';

let log = Logger.create('SpiderMonkeyDebugSession');

export class SpiderMonkeyDebugSession extends DebugSession {
    private connection: DebugConnection | null;

    public constructor() {
        log.debug("constructor");
        super();
        this.connection = null;
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {
        log.debug("initializeRequest");

        let body = {
            supportsConfigurationDoneRequest: true
        };
        response.body = body;
        this.sendResponse(response);
    }

    protected disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments): void {
        log.debug("disconnectRequest");

        if (this.connection) {
            this.connection.disconnect().then(() => {
                this.connection = null;
                this.sendResponse(response);
            });
        } else {
            this.sendResponse(response);
        }
    }

    /*
        Not supported:

        protected launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments): void;
    */

    protected attachRequest(response: DebugProtocol.AttachResponse, args: AttachRequestArguments): void {
        this.readConfig(args);
        log.debug("attachRequest");

        let port: number = args.port || 8089;
        let host: string = args.host || 'localhost';
        let socket = connect(port, host);
        this.startSession(socket);

        socket.on('connect', () => {
            log.debug('attachRequest: connection established. Testing...');

            if (this.connection == null) {
                throw new Error('this.connection is unexpectedly null');
            }

            let cmd = new Command('get_all_source_urls');
            this.connection.sendRequest(cmd, (res: Response) => {
                assert.notEqual(res, undefined);

                if (res.subtype == 'all_source_urls') {
                    log.debug('attachRequest: ...looks good');
                    this.sendResponse(response);
                } else {
                    log.error(`attachRequest: error while connecting to ${host}:${port}`);
                    response.success = false;
                    response.message = `Error while connecting to ${host}:${port}`;
                    this.sendResponse(response);
                }
            });
        });

        socket.on('error', (err) => {
            log.error(`attachRequest: failed to connect to ${host}:${port}`);
            response.success = false;
            response.message = `Could not connect to ${host}:${port}`;
            this.sendResponse(response);
        });
    }

    protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): void {
        const numberOfBreakpoints = args.breakpoints ? args.breakpoints.length : undefined;
        log.debug(`setBreakPointsRequest for ${numberOfBreakpoints} breakpoint(s): ${JSON.stringify(args)}`);
        this.sendResponse(response);
    }

    protected setFunctionBreakPointsRequest(response: DebugProtocol.SetFunctionBreakpointsResponse, args: DebugProtocol.SetFunctionBreakpointsArguments): void {
        log.debug("setFunctionBreakPointsRequest");
        this.sendResponse(response);
    }

    /*
        protected setExceptionBreakPointsRequest(response: DebugProtocol.SetExceptionBreakpointsResponse, args: DebugProtocol.SetExceptionBreakpointsArguments): void;
    */

    protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments): void {
        log.debug("configurationDoneRequest");
        this.sendResponse(response);
    }

    protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
        log.debug(`continueRequest for threadId: ${args.threadId}`);

        if (this.connection == null) {
            throw new Error('this.connection is unexpectedly null');
        }

        let contextId: ContextId = args.threadId || 0;
        let context = this.connection.coordinator.getContext(contextId);
        if (!context) {
            log.warn(`cannot continue context ${contextId}: no such context exists`);
            response.success = false;
            response.message = 'Cannot continue execution: internal error';
            this.sendResponse(response);
        }
        context.continue().then(() => {
            log.debug('continueRequest succeeded');
            this.sendResponse(response);
            let continuedEvent = new ContinuedEvent(context.id);
            this.sendEvent(continuedEvent);
        }, (err) => {
            log.error('continueRequest failed: ' + err);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        });
        this.sendResponse(response);
    }

    /*
        protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void;
        protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): void;
        protected stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments): void;
        protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments): void;
        protected restartFrameRequest(response: DebugProtocol.RestartFrameResponse, args: DebugProtocol.RestartFrameArguments): void;
        protected gotoRequest(response: DebugProtocol.GotoResponse, args: DebugProtocol.GotoArguments): void;
    */

    protected pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments): void {
        log.debug(`pauseRequest with threadId: ${args.threadId}`);

        if (this.connection == null) {
            throw new Error('this.connection is unexpectedly null');
        }

        const contextId: ContextId = args.threadId || 0;
        let context = this.connection.coordinator.getContext(contextId);
        if (!context) {
            log.warn(`cannot pause context ${contextId}: no such context exists`);
            response.success = false;
            response.message = 'Cannot pause execution: internal error';
            this.sendResponse(response);
            return;
        }
        context.pause().then(() => {
            log.debug('pauseRequest succeeded');
            this.sendResponse(response);
            let stoppedEvent = new StoppedEvent('pause', contextId);
            this.sendEvent(stoppedEvent);
        }, (err) => {
            log.error('pauseRequest failed: ' + err);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        });
    }

    /*
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

    private startSession(socket: Socket): void {
        log.debug("startSession");

        if (this.connection) {
            console.warn("startSession: already made a connection");
        }

        this.connection = new DebugConnection(socket);
        this.connection.on('newContext', (contextId, contextName, stopped) => {
            log.info(`new context on target: ${contextId}, ${contextName}, stopped: ${stopped}`);
            if (stopped) {
                let stoppedEvent = new StoppedEvent('pause', contextId);
                this.sendEvent(stoppedEvent);
            }
        });

        // Tell the frontend that we are ready to set breakpoints and so on. The frontend will end the configuration
        // sequence by calling 'configurationDone' request
        this.sendEvent(new InitializedEvent());
    }
}

DebugSession.run(SpiderMonkeyDebugSession);