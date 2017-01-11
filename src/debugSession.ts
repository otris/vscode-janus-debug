'use strict';

import * as assert from 'assert';
import * as fs from 'fs';
import { connect, Socket } from 'net';
import { ContinuedEvent, DebugSession, InitializedEvent, OutputEvent, StoppedEvent, TerminatedEvent } from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { AttachRequestArguments, CommonArguments, LaunchRequestArguments } from './config';
import { DebugConnection } from './connection';
import { ContextId } from './context';
import { Hash } from './cryptmd5';
import { FrameMap } from './frameMap';
import { Logger } from './log';
import { Breakpoint, Command, Response, StackFrame, Variable, variableValueToString } from './protocol';
import { SDSConnection } from './sds';
import { SourceMap } from './sourceMap';
import { VariablesMap } from './variablesMap';

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

/**
 * Construct a user-facing string from given Error instance.
 *
 * Currently: Just capitalize first letter.
 * @param {Error} err The Error instance.
 * @returns A string suitable for displaying to the user.
 */
function toUserMessage(err: Error): string {
    const str = err.message;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export class JanusDebugSession extends DebugSession {
    private connection: DebugConnection | undefined;
    private sourceMap: SourceMap;
    private frameMap: FrameMap;
    private variablesMap: VariablesMap;

    public constructor() {
        super();
        this.connection = undefined;
        this.sourceMap = new SourceMap();
        this.frameMap = new FrameMap();
        this.variablesMap = new VariablesMap();
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

        const sdsPort: number = args.port || 10000;
        const debuggerPort = 8089;
        const host: string = args.host || 'localhost';
        const username: string = args.username || '';
        const principal: string = args.principal || '';
        const password = new Hash(args.password) || '';
        const stopOnEntry = args.stopOnEntry || false;

        if (!args.script || typeof args.script !== 'string' || args.script.length === 0) {
            log.error(`launchRequest failed: no script specified by user`);
            response.success = false;
            response.message = `No script to launch.`;
            this.sendResponse(response);
            return;
        }

        const scriptPath = args.script;
        log.debug(`entry point: ${scriptPath}`);

        let scriptSource = '';
        try {
            scriptSource = fs.readFileSync(scriptPath, 'utf8');
        } catch (err) {
            log.error(`launchRequest failed: loading source from script failed: ${err}`);
            response.success = false;
            response.message = `Could not load source from '${scriptPath}': ${toUserMessage(err)}`;
            this.sendResponse(response);
            return;
        }

        let sdsSocket = connect(sdsPort, host);
        let sdsConnection = new SDSConnection(sdsSocket);

        sdsSocket.on('connect', () => {
            log.info(`connected to ${host}:${sdsPort}`);

            sdsConnection.connect().then(() => {

                log.info(`SDS connection established, got client ID: ${sdsConnection.clientId}`);
                return sdsConnection.changeUser(username, password);

            }).then(userId => {

                log.debug(`successfully changed user; new user id: ${userId}`);

                if (principal.length > 0) {
                    return sdsConnection.changePrincipal(principal);
                }

            }).then(() => {

                // Quick & dirty pause immediately feature
                if (stopOnEntry) {
                    scriptSource = 'debugger;' + scriptSource;
                }
                sdsConnection.runScriptOnServer(scriptSource).then(returnedString => {

                    // Important: this block is reached after the script returned and the debug session has ended. So
                    // the entire environment of this block might not even exist anymore!

                    log.debug(`script returned '${returnedString}'`);
                    this.debugConsole(returnedString);

                });

            }).then(() => {

                // Attach to debugger port and tell the frontend that we are ready to set breakpoints.
                let debuggerSocket = connect(debuggerPort, host);

                if (this.connection) {
                    console.warn("launchRequest: already made a connection to remote debugger");
                }

                const connection = new DebugConnection(debuggerSocket);
                this.connection = connection;

                debuggerSocket.on('connect', () => {

                    log.info(`launchRequest: connection to ${host}:${debuggerPort} established. Testing...`);

                    let timeout = new Promise<void>((resolve, reject) => {
                        setTimeout(reject, args.timeout || 6000, "Operation timed out");
                    });
                    let request = connection.sendRequest(new Command('get_all_source_urls'), (res: Response): Promise<void> => {

                        return new Promise<void>((resolve, reject) => {

                            assert.notEqual(res, undefined);

                            if (res.subtype === 'all_source_urls') {
                                log.info('launchRequest: ...looks good');
                                this.sourceMap.setAllRemoteUrls(res.content.urls);
                                resolve();
                            } else {
                                log.error(`launchRequest: error while connecting to ${host}:${debuggerPort}`);
                                reject(`Error while connecting to ${host}:${debuggerPort}`);
                            }
                        });
                    });
                    Promise.race([request, timeout]).then(() => {

                        log.debug(`sending InitializedEvent`);
                        this.sendEvent(new InitializedEvent());
                        this.debugConsole(`Debugger listening on ${host}:${debuggerPort}`);
                        this.sendResponse(response);

                    }).catch(reason => {
                        log.error(`launchRequest: ...failed. ${reason}`);
                        response.success = false;
                        response.message = `Could not attach to remote process: ${reason}`;
                        this.sendResponse(response);
                    });
                });

                debuggerSocket.on('close', (hadError: boolean) => {
                    if (hadError) {
                        log.error(`remote closed the connection due to error`);
                    } else {
                        log.info(`remote closed the connection`);
                    }
                    this.connection = undefined;
                    this.sendEvent(new TerminatedEvent());
                });

                debuggerSocket.on('error', (err: any) => {
                    log.error(`failed to connect to ${host}:${debuggerPort}: ${err.code}`);

                    response.success = false;
                    response.message = `Failed to connect to server: ${codeToString(err.code)}`;
                    if (err.code === 'ETIMEDOUT') {
                        response.message += `. Maybe wrong port or host?`;
                    }
                    this.sendResponse(response);

                    this.connection = undefined;
                    this.sendEvent(new TerminatedEvent());
                });

            }).catch(reason => {

                log.error(`launchRequest failed: ${reason}`);
                response.success = false;
                response.message = `Could not launch script: ${toUserMessage(reason)}.`;
                this.sendResponse(response);

            }).then(() => {

                log.debug(`done; disconnecting SDS connection`);
                sdsConnection.disconnect();

            });
        });

        sdsSocket.on('close', (hadError: boolean) => {
            if (hadError) {
                log.error(`remote closed SDS connection due to error`);
                response.success = false;
                response.message = `Failed to connect to server`;
                this.sendResponse(response);
            } else {
                log.info(`remote closed SDS connection`);
            }

            this.sendEvent(new TerminatedEvent());
        });

        sdsSocket.on('error', (err: any) => {

            log.error(`failed to connect to ${host}:${sdsPort}: ${err.code}`);

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
                this.debugConsole(`Debugger listening on ${host}:${port}`);
                this.sendResponse(response);

            }).catch(reason => {
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

        const localUrl: string = args.source.path;
        const requestedBreakpoints = args.breakpoints;

        let deleteAllBreakpointsCommand = new Command('delete_all_breakpoints');
        conn.sendRequest(deleteAllBreakpointsCommand, (res: Response) => {
            return new Promise<void>((resolve, reject) => {
                if (res.type === 'error') {
                    reject(new Error(`Target responded with error '${res.content.message}'`));
                } else {
                    resolve();
                }
            });
        }).then(() => {

            const remoteSourceUrl = this.sourceMap.remoteSourceUrl(localUrl);
            let actualBreakpoints: Array<Promise<Breakpoint>> = [];
            requestedBreakpoints.forEach((breakpoint => {

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
                        verified: !actualBreakpoint.pending,
                    };
                });
                log.debug(`setBreakPointsRequest succeeded: ${JSON.stringify(breakpoints)}`);
                response.body = {
                    breakpoints,
                };
                this.sendResponse(response);
            }).catch(reason => {
                log.error(`setBreakPointsRequest failed: ${reason}`);
                response.success = false;
                response.message = `Could not set breakpoint(s): ${reason}`;
                this.sendResponse(response);
            });
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
        contexts.forEach(context => {
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
        }, err => {
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
        }, err => {
            log.error('nextRequest failed: ' + err);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        });
    }

    protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): void {
        log.info(`stepInRequest for threadId: ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        let contextId: ContextId = args.threadId || 0;
        let context = this.connection.coordinator.getContext(contextId);

        context.stepIn().then(() => {
            log.debug('first stepInRequest succeeded');

            // We have to step in twice to get the correct stack frame
            context.stepIn().then(() => {
                log.debug('second stepInRequest succeeded');
                let stoppedEvent = new StoppedEvent('step', contextId);
                this.sendResponse(response);
                this.sendEvent(stoppedEvent);
            });
        }, (err) => {
            log.error('stepInRequest failed: ' + err);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        });
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
            let stackFrames: DebugProtocol.StackFrame[] = frames.map(frame => {
                return {
                    column: 0,
                    id: frame.frameId,
                    line: frame.sourceLine,
                    name: '', // TODO
                    source: {
                        path: frame.sourceUrl
                    },
                };
            });
            response.body = {
                stackFrames,
                totalFrames: trace.length,
            };

            // Update variablesMap
            context.getVariables().then((locals: Variable[]) => {
                log.info('Updating variables map');

                let frame = this.frameMap.getCurrentStackFrame(contextId);
                if (frame === undefined) {
                    log.error('[update variablesMap]: current frame is undefined.');
                    throw new Error('Internal error: Current frame not found.');
                }

                let frameId = frame.frameId;
                locals.forEach(variable => {
                    this.variablesMap.createVariable(variable.name, variable.value, contextId, frameId);
                });
            }).catch(reason => {
                log.error(`could not update variablesMap: ${reason}`);
            });

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

    protected async variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): Promise<void> {
        log.info(`variablesRequest with variablesReference ${args.variablesReference}`);

        try {
            // Get variables from the variables map
            let variablesContainer = this.variablesMap.getVariables(args.variablesReference);

            // Check if the returned variables container contains a object variable that is collapsed.
            // If so, we have to request the debugger to evaluate this variable.
            let collapsedVariables = variablesContainer.variables.filter((variable) => {
                return variable.name === '___jsrdbg_collapsed___';
            });

            if (collapsedVariables.length > 0) {
                // We have some collapsed variables => send a evaluation request to the debugger
                if (this.connection === undefined) {
                    throw new Error('Internal error: No connection');
                }

                let context = this.connection.coordinator.getContext(variablesContainer.contextId);
                for (let collapsedVariable of collapsedVariables) {
                    if (typeof collapsedVariable.evaluateName === 'undefined' || collapsedVariable.evaluateName === '') {
                        throw new Error(`Internal error: The variable "${collapsedVariable.name}" has no evaluate name.`);
                    }

                    // Request the variable and insert it to the variables map
                    let evaluateName = collapsedVariable.evaluateName.replace(".___jsrdbg_collapsed___", "");
                    let variable = await context.evaluate(evaluateName);
                    this.variablesMap.createVariable(
                        evaluateName.substr(evaluateName.lastIndexOf('.')),
                        JSON.parse(variable.value),
                        variablesContainer.contextId,
                        args.variablesReference,
                        evaluateName
                    );

                    // In the variables container we fetched before is now the collapsed variable and the new variable, so we have to
                    // refetch the variables container
                    variablesContainer = this.variablesMap.getVariables(args.variablesReference);

                    // Inside our variables container are not the variables we received from the debugger when we called the
                    // evaluate command, but a single variable (and of course the collapsed one) that refers to the variables container  
                    // we want. This is because of the "variablesMap.createVariable()"-command. This command recreated the variable 
                    // we requested for, but with a new variables container. We have to replace our existing variables container with that one.
                    variablesContainer = this.variablesMap.getVariables(variablesContainer.variables[1].variablesReference);
                    this.variablesMap.setVariables(args.variablesReference, variablesContainer);
                }
            }

            response.body = {
                variables: variablesContainer.variables
            };
        } catch (error) {
            response.success = false;
            response.message = error.message;
            log.error(`VariablesRequest failed: ${error.message}`);
        } finally {
            log.debug("send response");
            this.sendResponse(response);
        }
    }

    protected setVariableRequest(response: DebugProtocol.SetVariableResponse,
                                 args: DebugProtocol.SetVariableArguments): void {
        log.info(`setVariableRequest with variablesRequest ${args.variablesReference}`);

        if (this.connection === undefined) {
            throw new Error('No connetion');
        }

        // Get the variable which we want to set from the variables map
        let variablesContainer = this.variablesMap.getVariables(args.variablesReference);
        let variables = variablesContainer.variables.filter((variable) => {
            return variable.name === args.name;
        });

        if (variables.length < 1) {
            throw new Error(`Internal error: No variable found with variablesReference ${args.variablesReference} and name ${args.name}`);
        } else if (variables.length > 1) {
            throw new Error(`Internal error: Multiple variables found with variablesReference ${args.variablesReference} and name ${args.name}`);
        }

        // VS-Code will always return string-values, even if the variable is not a string. For this reason we have to cast the value to the
        // correct type. Because we can only change primitive types it's pretty easy
        let variableValue: any = args.value;

        if (variableValue === 'null') {
            variableValue = null;
        } else if (variableValue === 'undefined') {
            variableValue = undefined;
        } else if (/[0-9]+/.test(variableValue)) {
            variableValue = parseInt(variableValue, 10);
        } else if (variableValue === 'true') {
            variableValue = true;
        } else if (variableValue === 'false') {
            variableValue = false;
        }

        let variable: DebugProtocol.Variable = variables[0];
        if (typeof variable.evaluateName === 'undefined' || variable.evaluateName === '') {
            throw new Error(`Internal error: Variable ${variable.name} has no evaluate name.`);
        }

        let context = this.connection.coordinator.getContext(variablesContainer.contextId);
        context.setVariable(variable.evaluateName, variableValue).then(() => {
            // Everything fine. Replace the variable in the variables map
            variable.value = args.value;
            let indexOf = variablesContainer.variables.indexOf(variables[0]);
            variablesContainer[indexOf] = variable;
            this.variablesMap.setVariables(args.variablesReference, variablesContainer);

            response.body = variable;
            this.sendResponse(response);
        }).catch((reason) => {
            log.error(`setVariableRequest failed: ${reason}`);
            response.success = false;
            response.message = `Could not set variable "${args.name}": ${reason}`;
            this.sendResponse(response);
        });
    }

    protected evaluateRequest(response: DebugProtocol.EvaluateResponse,
                              args: DebugProtocol.EvaluateArguments): void {
        log.info(`evaluateRequest for contextId: ${args.context}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        if (args.frameId === undefined) {
            throw new Error('No frame id passed.');
        }

        let frame = this.frameMap.getStackFrame(args.frameId);
        let context = this.connection.coordinator.getContext(frame.contextId);
        context.evaluate(args.expression).then((variable: Variable) => {
            response.body = {
                result: variable.value,
                type: variable.type,
                variablesReference: 0,
            };

            log.debug('evalueteRequest succeeded');
            this.sendResponse(response);
        }).catch((reason) => {
            log.error(`evaluateRequest failed: ${reason}`);
            response.success = false;
            response.message = `Could not evaluate expression "${args.expression}": ${reason}`;
            this.sendResponse(response);
        });
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

    private debugConsole(message: string): void {
        this.sendEvent(new OutputEvent(message + '\n', 'console'));
    }
}

DebugSession.run(JanusDebugSession);
