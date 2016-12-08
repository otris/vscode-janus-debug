'use strict';

import * as assert from 'assert';
import { connect, Socket } from 'net';
import { DebugSession, InitializedEvent, StoppedEvent, ContinuedEvent } from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { CommonArguments, AttachRequestArguments } from './config';
import { DebugConnection } from './connection';
import { Command, Response, Breakpoint, StackFrame } from './protocol';
import { ContextId } from './context';
import { SourceMap } from './sourceMap';
import { FrameMap } from './frameMap';
import { Logger } from './log';

let log = Logger.create('JanusDebugSession');

export class JanusDebugSession extends DebugSession {
    private connection: DebugConnection | undefined;
    private sourceMap: SourceMap;
    private frameMap: FrameMap;

    public constructor() {
        super();
        this.connection = undefined;
        this.sourceMap = new SourceMap();
        this.frameMap = new FrameMap();
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {
        log.info("initializeRequest");

        let body = {
            supportsConfigurationDoneRequest: true,
            supportsFunctionBreakpoints: false,
            supportsConditionalBreakpoints: false,
            supportsHitConditionalBreakpoints: false,
            supportsEvaluateForHovers: false,
            exceptionBreakpointFilters: [],
            supportsStepBack: false,
            supportsSetVariable: false,
            supportsRestartFrame: false,
            supportsGotoTargetsRequest: false,
            supportsStepInTargetsRequest: false,
            supportsCompletionsRequest: false,
            supportsRunInTerminalRequest: false
        };
        response.body = body;
        this.sendResponse(response);
    }

    protected disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments): void {
        log.info("disconnectRequest");

        if (this.connection) {

            // Not really sure if this 'continue' really resumes all stopped contexts. And not sure
            // if this is really what we want. So this is an experiment
            this.connection.sendRequest(new Command('continue'));

            this.connection.sendRequest(new Command('exit'));

            this.connection.disconnect().then(() => {
                this.connection = undefined;
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
        log.info("attachRequest");

        let port: number = args.port || 8089;
        let host: string = args.host || 'localhost';
        let socket = connect(port, host);
        this.startSession(socket);

        socket.on('connect', () => {
            log.debug(`attachRequest: connection to ${host}:${port} established. Testing...`);

            if (this.connection === undefined) {
                throw new Error('No connection');
            }

            let cmd = new Command('get_all_source_urls');
            this.connection.sendRequest(cmd, (res: Response): Promise<void> => {

                return new Promise<void>((resolve, reject) => {

                    assert.notEqual(res, undefined);

                    if (res.subtype == 'all_source_urls') {
                        log.debug('attachRequest: ...looks good');
                        this.sourceMap.setAllRemoteUrls(res.content.urls);
                        resolve();
                    } else {
                        log.error(`attachRequest: error while connecting to ${host}:${port}`);
                        reject(`Error while connecting to ${host}:${port}`);
                    }
                });
            }).then(() => {

                // Tell the frontend that we are ready to set breakpoints and so on. The frontend will end the configuration
                // sequence by calling 'configurationDone' request
                log.debug(`sending InitializedEvent`);
                this.sendEvent(new InitializedEvent());

                this.sendResponse(response);

            }).catch(reason => {

                response.success = false;
                response.message = reason;
                this.sendResponse(response);
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
        const numberOfBreakpoints: number = args.breakpoints ? args.breakpoints.length : 0;
        log.info(`setBreakPointsRequest for ${numberOfBreakpoints} breakpoint(s): ${JSON.stringify(args)}`);

        if (!args.breakpoints || !args.source.path) {
            response.success = false;
            response.message = `An internal error occurred`;
            this.sendResponse(response);
            return;
        }

        if (this.connection === undefined) {
            throw new Error('No connection');
        }
        const conn = this.connection;

        let deleteAllBreakpointsCommand = new Command('delete_all_breakpoints');
        conn.sendRequest(deleteAllBreakpointsCommand, (response: Response) => {
            return new Promise<void>((resolve, reject) => {
                if (response.type === 'error') {
                    reject(new Error(`Target responded with error '${response.content.message}'`));
                } else {
                    resolve();
                }
            });
        });

        const localUrl: string = args.source.path;
        const remoteSourceUrl = this.sourceMap.remoteSourceUrl(localUrl);
        let actualBreakpoints: Promise<Breakpoint>[] = [];
        args.breakpoints.forEach((breakpoint => {

            let setBreakpointCommand = Command.setBreakpoint(remoteSourceUrl, breakpoint.line);

            actualBreakpoints.push(
                conn.sendRequest(setBreakpointCommand, (response: Response): Promise<Breakpoint> => {
                    return new Promise<Breakpoint>((resolve, reject) => {

                        if (response.type === 'error') {
                            reject(new Error(`Target responded with error '${response.content.message}'`));
                        } else {
                            resolve(response.content);
                        }
                    });
                }));
        }));

        Promise.all(actualBreakpoints).then((res: Breakpoint[]) => {
            let breakpoints: DebugProtocol.Breakpoint[] = res.map(actualBreakpoint => {
                return {
                    id: actualBreakpoint.bid,
                    verified: !actualBreakpoint.pending,
                    line: actualBreakpoint.line,
                    source: {
                        path: actualBreakpoint.url
                    }
                };
            });
            log.debug(`setting breakpoint(s) on target succeeded: ${JSON.stringify(breakpoints)}`);
            response.body = {
                breakpoints: breakpoints
            };
            this.sendResponse(response);
        }).catch((reason) => {
            log.error(`setBreakPointsRequest failed: ${reason}`);
            response.success = false;
            response.message = `Could not set breakpoint(s): ${reason}`;
            this.sendResponse(response);
        });
    }

    protected setFunctionBreakPointsRequest(response: DebugProtocol.SetFunctionBreakpointsResponse, args: DebugProtocol.SetFunctionBreakpointsArguments): void {
        log.info("setFunctionBreakPointsRequest");
        this.sendResponse(response);
    }

    /*
        protected setExceptionBreakPointsRequest(response: DebugProtocol.SetExceptionBreakpointsResponse, args: DebugProtocol.SetExceptionBreakpointsArguments): void;
    */

    protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments): void {
        log.info("configurationDoneRequest");
        this.sendResponse(response);
    }

    protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
        log.info(`continueRequest for threadId: ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
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

            let continuedEvent = new ContinuedEvent(context.id);
            this.sendEvent(continuedEvent);
            this.sendResponse(response);
        }, (err) => {
            log.error('continueRequest failed: ' + err);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        });
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
        log.info(`pauseRequest with threadId: ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        try {
            const contextId: ContextId = args.threadId || 0;

            let context = this.connection.coordinator.getContext(contextId);
            context.pause().then(() => {
                log.debug('pauseRequest succeeded');
                this.sendResponse(response);
                let stoppedEvent = new StoppedEvent('pause', contextId);
                this.sendEvent(stoppedEvent);
            }).catch(reason => {
                log.error('pauseRequest failed: ' + reason);
                response.success = false;
                response.message = reason.toString();
                this.sendResponse(response);
            });

        } catch (err) {
            log.error(`Cannot pause context: ${err}`);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        }
    }

    protected sourceRequest(response: DebugProtocol.SourceResponse, args: DebugProtocol.SourceArguments): void {
        log.info(`sourceRequest`);
        this.sendResponse(response);
    }

    protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
        log.info(`threadsRequest`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }
        let contexts = this.connection.coordinator.getAllAvailableContexts();
        let threads: DebugProtocol.Thread[] = contexts.map(context => {
            return {
                id: context.id,
                name: context.name
            };
        });
        response.body = {
            threads: threads
        };
        log.debug(`threadsRequest succeeded with ${JSON.stringify(response.body.threads)}`);
        this.sendResponse(response);
    }

    protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void {
        log.info(`stackTraceRequest for threadId ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        const contextId: ContextId = args.threadId || 0;
        let context = this.connection.coordinator.getContext(contextId);
        context.getStacktrace().then((trace: StackFrame[]) => {
            const frames = this.frameMap.addFrames(contextId, trace);
            let stackFrames: DebugProtocol.StackFrame[] = frames.map(frame => {
                return {
                    id: frame.frameId,
                    name: '', // TODO
                    source: {
                        path: frame.sourceUrl
                    },
                    line: frame.sourceLine,
                    column: 0
                };
            });
            response.body = {
                stackFrames: stackFrames,
                totalFrames: trace.length
            };
            log.debug(`stackTraceRequest succeeded`);
            this.sendResponse(response);
        });
    }

    protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {
        log.info(`scopesRequest for frameId ${args.frameId}`);
        this.sendResponse(response);
    }

    protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): void {
        log.info(`variablesRequest`);
        this.sendResponse(response);
    }

    /*
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
        log.info(`readConfig: ${JSON.stringify(args)}`);
    }

    private startSession(socket: Socket): void {
        log.debug("startSession");

        if (this.connection) {
            console.warn("startSession: already made a connection");
        }

        this.connection = new DebugConnection(socket);
        this.connection.on('newContext', (contextId, contextName, stopped) => {
            log.info(`new context on target: ${contextId}, context name: "${contextName}", stopped: ${stopped}`);
            if (stopped) {
                let stoppedEvent = new StoppedEvent('pause', contextId);
                log.debug(`sending StoppedEvent, reason: 'pause'`);
                this.sendEvent(stoppedEvent);
            }
        });
    }
}

DebugSession.run(JanusDebugSession);