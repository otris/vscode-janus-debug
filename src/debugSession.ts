'use strict';

import * as assert from 'assert';
import { connect, Socket } from 'net';
import { ContinuedEvent, DebugSession, InitializedEvent, StoppedEvent, TerminatedEvent } from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { AttachRequestArguments, CommonArguments, LaunchRequestArguments } from './config';
import { DebugConnection } from './connection';
import { ContextId } from './context';
import { FrameMap } from './frameMap';
import { Logger } from './log';
import { Breakpoint, Command, Response, StackFrame, Variable, variableValueToString } from './protocol';
import { SDSConnection } from './sds';
import { SourceMap } from './sourceMap';

let log = Logger.create('JanusDebugSession');

function codeToString(code: string): string {
    switch (code) {
        case 'ECANCELED':
            return 'Operation canceled';

        case 'ECONNABORTED':
            return 'Connection aborted';

        case 'ECONNREFUSED':
            return 'Connection refused';

        case 'ECONNRESET':
            return 'Connection reset';

        case 'ETIMEDOUT':
            return 'Connection timed out';

        default:
            return 'Unknown error';
    }
}

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

    protected initializeRequest(response: DebugProtocol.InitializeResponse,
                                args: DebugProtocol.InitializeRequestArguments): void {
        log.info("initializeRequest");

        let body = {
            exceptionBreakpointFilters: [],
            supportsCompletionsRequest: false,
            supportsConditionalBreakpoints: false,
            supportsConfigurationDoneRequest: true,
            supportsEvaluateForHovers: false,
            supportsFunctionBreakpoints: false,
            supportsGotoTargetsRequest: false,
            supportsHitConditionalBreakpoints: false,
            supportsRestartFrame: false,
            supportsRunInTerminalRequest: false,
            supportsSetVariable: false,
            supportsStepBack: false,
            supportsStepInTargetsRequest: false,
        };
        response.body = body;
        this.sendResponse(response);
    }

    protected disconnectRequest(response: DebugProtocol.DisconnectResponse,
                                args: DebugProtocol.DisconnectArguments): void {
        log.info("disconnectRequest");

        const connection = this.connection;
        if (!connection) {
            this.sendResponse(response);
            return;
        }

        connection.sendRequest(new Command('exit')).then(() => {
            return connection.disconnect();
        }).then(() => {
            this.connection = undefined;
            this.sendResponse(response);
        });
    }

    protected launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments): void {
        this.readConfig(args);
        log.info(`launchRequest`);

        let port: number = args.port || 10000;
        let host: string = args.host || 'localhost';
        let sdsSocket = connect(port, host);

        let sdsConnection = new SDSConnection(sdsSocket);

        sdsSocket.on('connect', () => {
            log.info(`connected to ${host}:${port}`);

            sdsConnection.connect().then(() => {

                log.debug(`SDS connection established`);

            }).catch((reason) => {

                // Something went wrong starting the script. No reason to proceed with anything here...

                log.error(`launchRequest failed: ${reason}`);
                response.success = false;
                response.message = `Could not start script: ${reason}`;
                this.sendResponse(response);

            });
        });

        sdsSocket.on('close', (hadError: boolean) => {
            if (hadError) {
                log.error(`remote closed SDS connection due to error`);
            } else {
                log.info(`remote closed SDS connection`);
            }

            response.success = false;
            response.message = `Failed to connect to server`;
            this.sendResponse(response);

            this.sendEvent(new TerminatedEvent());
        });

        sdsSocket.on('error', (err: any) => {

            log.error(`failed to connect to ${host}:${port}: ${err.code}`);

            response.success = false;
            response.message = `Failed to connect to server: ${codeToString(err.code)}`;
            if (err.code === 'ETIMEDOUT') {
                response.message += `. Maybe wrong port or host?`;
            }
            this.sendResponse(response);

            this.sendEvent(new TerminatedEvent());
        });
    }

    protected attachRequest(response: DebugProtocol.AttachResponse, args: AttachRequestArguments): void {
        this.readConfig(args);
        log.info(`attachRequest`);

        let port: number = args.port || 8089;
        let host: string = args.host || 'localhost';
        let socket = connect(port, host);

        if (this.connection) {
            console.warn("attachRequest: already made a connection");
        }

        const connection = new DebugConnection(socket);
        this.connection = connection;

        socket.on('connect', () => {

            // TCP connection established. It is important for this client that we first send a 'get_all_source_urls'
            // request to the server. This way we have a list of all currently active contexts.

            log.info(`attachRequest: connection to ${host}:${port} established. Testing...`);

            let timeout = new Promise<void>((resolve, reject) => {
                setTimeout(reject, args.timeout || 6000, "Operation timed out");
            });
            let request = connection.sendRequest(new Command('get_all_source_urls'), (res: Response): Promise<void> => {

                return new Promise<void>((resolve, reject) => {

                    assert.notEqual(res, undefined);

                    if (res.subtype === 'all_source_urls') {
                        log.info('attachRequest: ...looks good');
                        this.sourceMap.setAllRemoteUrls(res.content.urls);
                        resolve();
                    } else {
                        log.error(`attachRequest: error while connecting to ${host}:${port}`);
                        reject(`Error while connecting to ${host}:${port}`);
                    }
                });
            });
            Promise.race([request, timeout]).then(() => {

                // Tell the frontend that we are ready to set breakpoints and so on. The frontend will end the
                // configuration sequence by calling 'configurationDone' request
                log.debug(`sending InitializedEvent`);
                this.sendEvent(new InitializedEvent());

                this.sendResponse(response);

            }).catch((reason) => {
                log.error(`attachRequest: ...failed. ${reason}`);
                response.success = false;
                response.message = `Could not attach to remote process: ${reason}`;
                this.sendResponse(response);
            });
        });

        socket.on('close', (hadError: boolean) => {
            if (hadError) {
                log.error(`remote closed the connection due to error`);
            } else {
                log.info(`remote closed the connection`);
            }
            this.connection = undefined;
            this.sendEvent(new TerminatedEvent());
        });

        socket.on('error', (err: any) => {
            log.error(`failed to connect to ${host}:${port}: ${err.code}`);

            response.success = false;
            response.message = `Failed to connect to server: ${codeToString(err.code)}`;
            if (err.code === 'ETIMEDOUT') {
                response.message += `. Maybe wrong port or host?`;
            }
            this.sendResponse(response);

            this.connection = undefined;
            this.sendEvent(new TerminatedEvent());
        });
    }

    protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse,
                                    args: DebugProtocol.SetBreakpointsArguments): void {
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
        conn.sendRequest(deleteAllBreakpointsCommand, (res: Response) => {
            return new Promise<void>((resolve, reject) => {
                if (res.type === 'error') {
                    reject(new Error(`Target responded with error '${res.content.message}'`));
                } else {
                    resolve();
                }
            });
        });

        const localUrl: string = args.source.path;
        const remoteSourceUrl = this.sourceMap.remoteSourceUrl(localUrl);
        let actualBreakpoints: Array<Promise<Breakpoint>> = [];
        args.breakpoints.forEach(((breakpoint) => {

            let setBreakpointCommand = Command.setBreakpoint(remoteSourceUrl, breakpoint.line);

            actualBreakpoints.push(
                conn.sendRequest(setBreakpointCommand, (res: Response): Promise<Breakpoint> => {
                    return new Promise<Breakpoint>((resolve, reject) => {

                        if (res.type === 'error') {
                            reject(new Error(`Target responded with error '${res.content.message}'`));
                        } else {
                            resolve(res.content);
                        }
                    });
                }));
        }));

        Promise.all(actualBreakpoints).then((res: Breakpoint[]) => {
            let breakpoints: DebugProtocol.Breakpoint[] = res.map((actualBreakpoint) => {
                return {
                    id: actualBreakpoint.bid,
                    line: actualBreakpoint.line,
                    source: {
                        path: actualBreakpoint.url,
                    },
                    verified: true,
                };
            });
            log.debug(`setBreakPointsRequest succeeded: ${JSON.stringify(breakpoints)}`);
            response.body = {
                breakpoints,
            };
            this.sendResponse(response);
        }).catch((reason) => {
            log.error(`setBreakPointsRequest failed: ${reason}`);
            response.success = false;
            response.message = `Could not set breakpoint(s): ${reason}`;
            this.sendResponse(response);
        });
    }

    protected setFunctionBreakPointsRequest(response: DebugProtocol.SetFunctionBreakpointsResponse,
                                            args: DebugProtocol.SetFunctionBreakpointsArguments): void {
        log.info("setFunctionBreakPointsRequest");
        this.sendResponse(response);
    }

    protected setExceptionBreakPointsRequest(response: DebugProtocol.SetExceptionBreakpointsResponse,
                                             args: DebugProtocol.SetExceptionBreakpointsArguments): void {
        log.info("setExceptionBreakPointsRequest");
    }

    protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse,
                                       args: DebugProtocol.ConfigurationDoneArguments): void {
        log.info("configurationDoneRequest");

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        // Only after all configuration is done it is allowed to notify the frontend about paused contexts. We do
        // this once initially for all already discovered contexts and then let an event handler do this for future
        // contexts.

        let contexts = this.connection.coordinator.getAllAvailableContexts();
        contexts.forEach((context) => {
            if (context.isStopped()) {
                log.debug(`sending StoppedEvent('pause', ${context.id})`);
                let stoppedEvent = new StoppedEvent('pause', context.id);
                this.sendEvent(stoppedEvent);
            }
        });

        this.connection.on('newContext', (contextId, contextName, stopped) => {
            log.info(`new context on target: ${contextId}, context name: "${contextName}", stopped: ${stopped}`);
            if (stopped) {
                let stoppedEvent = new StoppedEvent('pause', contextId);
                log.debug(`sending StoppedEvent('pause', ${contextId})`);
                this.sendEvent(stoppedEvent);
            }
        });

        this.sendResponse(response);
    }

    protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
        log.info(`continueRequest for threadId: ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        let contextId: ContextId = args.threadId || 0;
        let context = this.connection.coordinator.getContext(contextId);

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

    protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void {
        log.info(`nextRequest for threadId: ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        let contextId: ContextId = args.threadId || 0;
        let context = this.connection.coordinator.getContext(contextId);

        context.next().then(() => {
            log.debug('nextRequest succeeded');
            let stoppedEvent = new StoppedEvent('step', contextId);
            this.sendResponse(response);
            this.sendEvent(stoppedEvent);
        }, (err) => {
            log.error('nextRequest failed: ' + err);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        });
    }

    protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): void {
        log.info("stepInRequest");
    }

    protected stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments): void {
        log.info("stepOutRequest");
    }

    protected stepBackRequest(response: DebugProtocol.StepBackResponse,
                              args: DebugProtocol.StepBackArguments): void {
        log.info("stepBackRequest");
    }

    protected restartFrameRequest(response: DebugProtocol.RestartFrameResponse,
                                  args: DebugProtocol.RestartFrameArguments): void {
        log.info("restartFrameRequest");
    }

    protected gotoRequest(response: DebugProtocol.GotoResponse, args: DebugProtocol.GotoArguments): void {
        log.info("gotoRequest");
    }

    protected pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments): void {
        log.info(`pauseRequest for threadId: ${args.threadId}`);

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
            }).catch((reason) => {
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
        let threads: DebugProtocol.Thread[] = contexts.map((context) => {
            return {
                id: context.id,
                name: context.name,
            };
        });
        response.body = {
            threads,
        };
        log.debug(`threadsRequest succeeded with ${JSON.stringify(response.body.threads)}`);
        this.sendResponse(response);
    }

    protected stackTraceRequest(response: DebugProtocol.StackTraceResponse,
                                args: DebugProtocol.StackTraceArguments): void {
        log.info(`stackTraceRequest for threadId ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        const contextId: ContextId = args.threadId || 0;
        let context = this.connection.coordinator.getContext(contextId);
        context.getStacktrace().then((trace: StackFrame[]) => {
            const frames = this.frameMap.addFrames(contextId, trace);
            let stackFrames: DebugProtocol.StackFrame[] = frames.map((frame) => {
                return {
                    column: 0,
                    id: frame.frameId,
                    line: frame.sourceLine,
                    name: '', // TODO
                    source: {
                        path: frame.sourceUrl,
                    },
                };
            });
            response.body = {
                stackFrames,
                totalFrames: trace.length,
            };
            log.debug(`stackTraceRequest succeeded`);
            this.sendResponse(response);
        });
    }

    protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {
        log.info(`scopesRequest for frameId ${args.frameId}`);

        // The variablesReference is just the frameId because we do not keep track of individual scopes in a frame.

        let scopes: DebugProtocol.Scope[] = [{
            expensive: false,
            name: 'Locals',
            variablesReference: args.frameId,
        }];

        response.body = {
            scopes,
        };
        this.sendResponse(response);
    }

    protected variablesRequest(response: DebugProtocol.VariablesResponse,
                               args: DebugProtocol.VariablesArguments): void {
        log.info(`variablesRequest with variablesReference ${args.variablesReference}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        let frame = this.frameMap.getStackFrame(args.variablesReference);
        let context = this.connection.coordinator.getContext(frame.contextId);
        context.getVariables().then((locals: Variable[]) => {
            let variables: DebugProtocol.Variable[] = locals.map((variable) => {
                return {
                    name: variable.name,
                    value: variableValueToString(variable.value),
                    variablesReference: 0,
                };
            });

            response.body = {
                variables,
            };
            log.debug(`variablesRequest succeeded`);
            this.sendResponse(response);
        }).catch((reason) => {
            log.error(`variablesRequest failed: ${reason}`);
            response.success = false;
            response.message = `Could not get variable(s): ${reason}`;
            this.sendResponse(response);
        });
    }

    protected setVariableRequest(response: DebugProtocol.SetVariableResponse,
                                 args: DebugProtocol.SetVariableArguments): void {
        log.info(`setVariableRequest`);
    }

    protected evaluateRequest(response: DebugProtocol.EvaluateResponse,
                              args: DebugProtocol.EvaluateArguments): void {
        log.info(`evaluateRequest`);
    }

    protected stepInTargetsRequest(response: DebugProtocol.StepInTargetsResponse,
                                   args: DebugProtocol.StepInTargetsArguments): void {
        log.info(`stepInTargetsRequest`);
    }

    protected gotoTargetsRequest(response: DebugProtocol.GotoTargetsResponse,
                                 args: DebugProtocol.GotoTargetsArguments): void {
        log.info(`gotoTargetsRequest`);
    }

    protected completionsRequest(response: DebugProtocol.CompletionsResponse,
                                 args: DebugProtocol.CompletionsArguments): void {
        log.info(`completionsRequest`);
    }

    private readConfig(args: CommonArguments): void {
        if (args.log) {
            Logger.config = args.log;
        }
        log.info(`readConfig: ${JSON.stringify(args)}`);
    }
}

DebugSession.run(JanusDebugSession);
