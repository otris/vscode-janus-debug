import * as assert from 'assert';
import { connect, Socket } from 'net';
import { Logger } from 'node-file-log';
import { crypt_md5, SDSConnection } from 'node-sds';
import * as path from 'path';
import { v4 as uuidV4 } from 'uuid';
import { ContinuedEvent, DebugSession, InitializedEvent, OutputEvent, StoppedEvent, TerminatedEvent } from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { AttachRequestArguments, CommonArguments, LaunchRequestArguments } from './config';
import { DebugConnection } from './connection';
import { Context, ContextId } from './context';
import { FrameMap } from './frameMap';
import { DebugAdapterIPC } from './ipcClient';
import { Breakpoint, Command, Response, StackFrame, Variable, variableValueToString } from './protocol';
import { LocalSource, ServerSource, SourceMap } from './sourceMap';
import { VariablesContainer, VariablesMap } from './variablesMap';

const log = Logger.create('JanusDebugSession');

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
    private config: 'launch' | 'attach' | undefined;
    private attachedContextId: number | undefined = undefined;

    public constructor() {
        super();
        this.connection = undefined;
        this.sourceMap = new SourceMap();
        this.frameMap = new FrameMap();
        this.variablesMap = new VariablesMap();
    }

    protected async logServerVersion() {
        log.debug("sending sever_version Request ...");
        if (this.connection) {
            await this.connection.sendRequest(new Command('server_version'), async (response: Response) => {
                log.info(`Determined version ${response.content.version ? response.content.version : undefined} of remote debugger`);
            });
        } else {
            log.error("Connection must not be undefined to log server version.");
            throw new Error("Connection must not be undefined to log server version.");
        }
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {
        log.info("initializeRequest");

        const body = {
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

    protected async disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments): Promise<void> {
        log.info(`disconnectRequest; debug adapter running in ${this.config} config`);

        this.attachedContextId = undefined;

        this.config = undefined;

        const connection = this.connection;
        if (!connection) {
            this.sendResponse(response);
            return;
        }

        if (this.config === 'launch') {
            await connection.sendRequest(new Command('stop'));
        }

        await connection.sendRequest(new Command('exit'));
        await connection.disconnect();
        this.connection = undefined;
        this.sendResponse(response);
    }

    protected async launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments): Promise<void> {
        this.applyConfig(args);
        log.info(`launchRequest`);

        this.config = 'launch';

        const sdsPort: number = args.applicationPort || 10000;
        const debuggerPort = args.debuggerPort || 8089;
        const host: string = args.host || 'localhost';
        const username: string = args.username || '';
        const principal: string = args.principal || '';
        const password = args.password.length > 0 ? crypt_md5(args.password, 'o3') : '';
        const stopOnEntry = args.stopOnEntry;

        let scriptIdentifier: string | undefined;

        if (!args.script || typeof args.script !== 'string' || args.script.length === 0) {
            log.error(`launchRequest failed: no script specified by user`);
            response.success = false;
            response.message = `No script to launch.`;
            this.sendResponse(response);
            return;
        }

        const source = new LocalSource(args.script);
        let scriptSource: string;
        try {
            scriptSource = source.loadFromDisk();
        } catch (err) {
            log.error(`launchRequest failed: loading source from script failed: ${err}`);
            response.success = false;
            response.message = `Could not load source from '${source.path}': ${toUserMessage(err)}`;
            this.sendResponse(response);
            return;
        }

        const ipcClient = new DebugAdapterIPC();
        await ipcClient.connect();
        let uris: string[] | undefined;
        try {
            uris = await ipcClient.findURIsInWorkspace();
            log.debug(`found ${JSON.stringify(uris)} URIs in workspace`);
            this.sourceMap.setLocalUrls(uris);
        } catch (e) {
            log.error(`error ${e}`);
        }

        const connectDebugger = async () => {
            // Attach to debugger port and tell the frontend that we are ready to set breakpoints.
            const debuggerSocket = connect(debuggerPort, host);

            if (this.connection) {
                log.warn("launchRequest: already made a connection to remote debugger");
            }

            const connection = new DebugConnection(debuggerSocket);
            this.connection = connection;

            this.logServerVersion();

            this.connection.on('contextPaused', (contextId: number) => {
                this.sendEvent(new StoppedEvent("hit breakpoint", contextId));
            });

            this.connection.on('error', (reason: string) => {
                log.error(`Error on connection: ${reason}`);
                response.success = false;
                response.message = reason;
                this.sendResponse(response);
                this.connection = undefined;
                this.sendEvent(new TerminatedEvent());
            });

            debuggerSocket.on('connect', async () => {

                log.info(`launchRequest: connection to ${host}:${debuggerPort} established. Testing...`);

                if (scriptIdentifier) {
                    this.sourceMap.addMapping(source, scriptIdentifier);
                } else {
                    this.sourceMap.addMapping(source, source.sourceName());
                }

                try {
                    const sources = await connection.sendRequest(Command.getSource(source.sourceName()),
                        async (res: Response) => res.content.source);
                    log.info(`retrieved server sources: ${JSON.stringify(sources)}`);
                    this.sourceMap.serverSource = ServerSource.fromSources(sources);
                } catch (e) {
                    log.error(`Command.getSource failed ${e}`);
                }

                if (stopOnEntry || args.portal) {
                    // Single step because of debugger; statement.
                    const contexts = await connection.coordinator.getAllAvailableContexts();
                    contexts.forEach(async context => {
                        if (context.isStopped()) {
                            if (context.name === source.sourceName()) {
                                await connection.sendRequest(new Command('next', context.id));
                                // FIXME: there can be more than one context here
                            }
                        }
                    });
                }

                log.debug(`sending InitializedEvent`);
                this.sendEvent(new InitializedEvent());
                this.debugConsole(`Debugger listening on ${host}:${debuggerPort}`);
                this.sendResponse(response);
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
        };

        if (args.portal) {
            log.info(`Script is already running on DOCUMENTS server, just connect the debugger`);
            await connectDebugger();
        } else {
            const sdsSocket = connect(sdsPort, host);
            const sdsConnection = new SDSConnection(sdsSocket);
            sdsConnection.timeout = args.timeout || 6000;

            sdsSocket.on('connect', () => {
                log.info(`connected to ${host}:${sdsPort}`);

                sdsConnection.connect('vscode-janus-debug').then(() => {

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

                    // fill identifier
                    scriptIdentifier = uuidV4();
                    log.debug("launching script with identifier: " + scriptIdentifier);
                    sdsConnection.runScriptOnServer(scriptSource, scriptIdentifier).then(returnedString => {

                        // Important: this block is reached after the script returned and the debug session has ended. So
                        // the entire environment of this block might not even exist anymore!

                        log.debug(`script returned '${returnedString}'`);
                        this.debugConsole(returnedString);

                    });

                }).then(connectDebugger).catch(reason => {

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
    }

    protected async attachRequest(response: DebugProtocol.AttachResponse, args: AttachRequestArguments): Promise<void> {
        this.applyConfig(args);
        log.info(`attachRequest`);

        this.config = 'attach';

        const ipcClient = new DebugAdapterIPC();
        await ipcClient.connect();

        const port: number = args.debuggerPort || 8089;
        const host: string = args.host || 'localhost';
        const socket = connect(port, host);

        if (this.connection) {
            log.warn("attachRequest: already made a connection");
        }

        const connection = new DebugConnection(socket);
        this.connection = connection;

        this.connection.on('contextPaused', (ctxId: number) => {
            this.sendEvent(new StoppedEvent("hit breakpoint", ctxId));
        });

        this.connection.on('error', (reason: string) => {
            log.error(`Error on connection: ${reason}`);
            response.success = false;
            response.message = reason;
            this.sendResponse(response);
            this.connection = undefined;
            this.sendEvent(new TerminatedEvent());
        });

        this.logServerVersion();

        socket.on('connect', async () => {

            // TCP connection established. It is important for this client that we first send a 'get_all_source_urls'
            // request to the server. This way we have a list of all currently active contexts.

            log.info(`attachRequest: connection to ${host}:${port} established. Testing...`);

            try {

                if (this.connection) {
                    const contexts: Context[] = await this.connection.coordinator.getAllAvailableContexts();
                    log.info(`available contexts: ${contexts.length}`);
                    if (contexts.length < 1) {
                        throw new Error("no context found to attach to");
                    } else {
                        let targetContext: Context;
                        if (contexts.length > 1) {
                            const ctxNameAttach = await ipcClient.showContextQuickPick(contexts.map((mCtx) => mCtx.name));
                            log.info(`got ${ctxNameAttach} to attach to`);
                            targetContext = contexts.filter((mCtx) => mCtx.name === ctxNameAttach)[0];
                        } else {
                            targetContext = contexts[0];
                        }
                        log.info(`chose context '${targetContext.name}'`);
                        targetContext.pause();
                        // looking for source
                        // const src: string = await connection.sendRequest(Command.getSource(targetContext.name));
                        const lScr = new LocalSource(targetContext.name);
                        lScr.sourceReference = targetContext.id;
                        this.sourceMap.addMapping(lScr, targetContext.name);
                        // set state for setBreakpoints
                        this.attachedContextId = targetContext.id;
                    }
                } else {
                    throw new Error(`not connected to a remote debugger`);
                }

            } catch (e) {
                log.error(`attachRequest: ...failed. ${e}`);
                response.success = false;
                response.message = `Could not attach to remote JS context: ${e}`;
                return this.sendResponse(response);
            }

            // Tell the frontend that we are ready to set breakpoints and so on. The frontend will end the
            // configuration sequence by calling 'configurationDone' request
            log.debug(`sending InitializedEvent`);
            this.sendEvent(new InitializedEvent());
            this.debugConsole(`Debugger listening on ${host}:${port}`);
            this.sendResponse(response);
        });

        socket.on('close', async (hadError: boolean) => {
            await ipcClient.disconnect();

            if (hadError) {
                log.error(`remote closed the connection due to error`);
            } else {
                log.info(`remote closed the connection`);
            }
            this.connection = undefined;
            this.sendEvent(new TerminatedEvent());
        });

        socket.on('error', async (err: any) => {
            log.error(`failed to connect to ${host}:${port}: ${err.code}`);
            await ipcClient.disconnect();

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

    protected async setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): Promise<void> {
        const numberOfBreakpoints: number = args.breakpoints ? args.breakpoints.length : 0;
        log.info(`setBreakPointsRequest for ${numberOfBreakpoints} breakpoint(s): ${JSON.stringify(args)}`);

        if (!args.breakpoints || !args.source.path || !args.source.name) {
            response.success = false;
            response.message = `An internal error occurred`;
            this.sendResponse(response);
            return;
        }

        const source = path.parse(args.source.name).name;

        if (this.connection === undefined) {
            throw new Error('No connection');
        }
        const conn = this.connection;


        const requestedBreakpoints = args.breakpoints;

        const deleteAllBreakpointsCommand = new Command('delete_all_breakpoints');
        await conn.sendRequest(deleteAllBreakpointsCommand, (res: Response) => {
            return new Promise<void>((resolve, reject) => {
                if (res.type === 'error') {
                    reject(new Error(`Target responded with error '${res.content.message}'`));
                } else {
                    resolve();
                }
            });
        });

        let remoteSourceUrl = "";
        if (this.attachedContextId !== undefined) {
            remoteSourceUrl = await this.connection.coordinator.getContext(this.attachedContextId)
                .name;
        } else {
            const localUrl: string = args.source.path;
            remoteSourceUrl = this.sourceMap.getRemoteUrl(localUrl);
        }
        const actualBreakpoints: Array<Promise<Breakpoint>> = [];
        requestedBreakpoints.forEach((breakpoint => {

            const remoteLine = this.sourceMap.toRemoteLine({
                source,
                line: breakpoint.line
            });
            const setBreakpointCommand = Command.setBreakpoint(remoteSourceUrl, remoteLine,
                false, this.attachedContextId);

            actualBreakpoints.push(
                conn.sendRequest(setBreakpointCommand, (res: Response): Promise<Breakpoint> => {
                    return new Promise<Breakpoint>((resolve, reject) => {
                        // When the debugger give a error back but send a message that a breakpoint
                        // cant set, we do no reject but make the specific breakpoint unverified.
                        // We do this by passing a new breakpoint to the resolve function with the
                        // pending attribute set to false.
                        if ((res.type === 'error' && res.content.message)
                            && (res.content.message === 'Cannot set breakpoint at given line.')) {
                            resolve({
                                line: breakpoint.line,
                                pending: false,
                            } as Breakpoint);
                        }
                        // When the debugger give a error back and the message
                        // dont tell us that a breakpoint cant set we reject this one, cause a 'unknown'
                        // error occur.
                        // That results in a complete reject of every breakpoint.
                        if ((res.type === 'error') && res.content.message
                            && (res.content.message !== 'Cannot set breakpoint at given line.')) {
                            reject(new Error(`Target responded with error '${res.content.message}'`));
                        } else {
                            // The debug engine tells us that the current breakpoint can set, so
                            // the breakpoint will verified in vscode.
                            res.content.pending = true;
                            resolve(res.content);
                        }
                    });
                }));
        }));

        Promise.all(actualBreakpoints).then((res: Breakpoint[]) => {
            const breakpoints: DebugProtocol.Breakpoint[] = res.map(actualBreakpoint => {
                const localPos = this.sourceMap.toLocalPosition(actualBreakpoint.line);
                const localSource = this.sourceMap.getSource(localPos.source);
                return {
                    id: actualBreakpoint.bid,
                    line: localPos.line,
                    source: {
                        path: localSource ? localSource.name : "",
                    },

                    // According to the pre calculated value of pending the
                    // breakpoint is set to verified or to unverified.
                    verified: actualBreakpoint.pending,
                    // If the current breakpoint is unverified, we like to give a little hint.
                    message: actualBreakpoint.pending ? '' : 'Cannot set breakpoint at this line'

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
    }

    protected setFunctionBreakPointsRequest(response: DebugProtocol.SetFunctionBreakpointsResponse, args: DebugProtocol.SetFunctionBreakpointsArguments): void {
        log.info("setFunctionBreakPointsRequest");
        this.sendResponse(response);
    }

    protected setExceptionBreakPointsRequest(response: DebugProtocol.SetExceptionBreakpointsResponse, args: DebugProtocol.SetExceptionBreakpointsArguments): void {
        log.info("setExceptionBreakPointsRequest");
    }

    protected async configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments): Promise<void> {
        log.info("configurationDoneRequest");

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        // Only after all configuration is done it is allowed to notify the frontend about paused contexts. We do
        // this once initially for all already discovered contexts and then let an event handler do this for future
        // contexts.
        const contexts = await this.connection.coordinator.getAllAvailableContexts();
        contexts.forEach(context => {
            if (context.isStopped()) {
                log.debug(`sending StoppedEvent('pause', ${context.id})`);
                const stoppedEvent = new StoppedEvent('pause', context.id);
                this.sendEvent(stoppedEvent);
            }
        });

        this.connection.on('newContext', (contextId: number, contextName: string, stopped: boolean) => {
            log.info(`new context on target: ${contextId}, context name: "${contextName}", stopped: ${stopped}`);
            if (stopped) {
                const stoppedEvent = new StoppedEvent('pause', contextId);
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

        const contextId: ContextId = args.threadId || 0;
        const context = this.connection.coordinator.getContext(contextId);

        context.continue().then(() => {
            log.debug('continueRequest succeeded');

            const continuedEvent = new ContinuedEvent(context.id);
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

        const contextId: ContextId = args.threadId || 0;
        const context = this.connection.coordinator.getContext(contextId);

        context.next().then(() => {
            log.debug('nextRequest succeeded');
            const stoppedEvent = new StoppedEvent('step', contextId);
            this.sendResponse(response);
            this.sendEvent(stoppedEvent);
        }, err => {
            log.error('nextRequest failed: ' + err);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        });
    }

    protected async stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): Promise<void> {
        log.info(`stepInRequest for threadId: ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        const contextId: ContextId = args.threadId || 0;
        const context = this.connection.coordinator.getContext(contextId);

        try {
            await context.stepIn();
            log.debug('first stepInRequest succeeded');

            // We have to step in twice to get the correct stack frame
            log.debug('second stepInRequest succeeded');
            const stoppedEvent = new StoppedEvent('step', contextId);
            this.sendResponse(response);
            this.sendEvent(stoppedEvent);
        } catch (err) {
            log.error('stepInRequest failed: ' + err);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        }
    }

    protected async stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments): Promise<void> {
        log.info(`stepOutRequest for threadId: ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        const contextId: ContextId = args.threadId || 0;
        const context = this.connection.coordinator.getContext(contextId);

        try {
            await context.stepOut();

            log.debug('first stepOutRequest succeeded');

            const stoppedEvent = new StoppedEvent('step_out', contextId);
            this.sendResponse(response);
            this.sendEvent(stoppedEvent);

        } catch (err) {
            log.error('stepOutRequest failed: ' + err);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        }
    }

    protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments): void {
        log.info("stepBackRequest");
    }

    protected restartFrameRequest(response: DebugProtocol.RestartFrameResponse, args: DebugProtocol.RestartFrameArguments): void {
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

            const context = this.connection.coordinator.getContext(contextId);
            context.pause().then(() => {
                log.debug('pauseRequest succeeded');
                this.sendResponse(response);
                const stoppedEvent = new StoppedEvent('pause', contextId);
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

    protected async sourceRequest(response: DebugProtocol.SourceResponse, args: DebugProtocol.SourceArguments): Promise<void> {
        if (args.sourceReference === undefined) {
            log.info('sourceRequest');
            log.warn('args.sourceReference is undefined');
            this.sendResponse(response);
            return;
        }

        log.info(`sourceRequest for sourceReference ${args.sourceReference}`);
        // const localSource = this.sourceMap.getSourceByReference(args.sourceReference);
        if (!this.connection) {
            throw new Error("connection must be defined");
        }

        try {
            response.body = await this.connection.sendRequest(Command.getSource(
                this.connection.coordinator.getContext(args.sourceReference).name),
                async (res) => {
                    log.info(`res: ${JSON.stringify(res)}, source: ${JSON.stringify(res.content.source)}`);
                    const sourceCode = res.content.source.reduce((a: any, b: any) => a + "\n" + b);
                    return {
                        content: sourceCode,
                        mimeType: 'text/javascript'
                    };
                });
        } catch (err) {
            log.error(`an error occurs: ${err}`);
            response.success = false;
        }
        this.sendResponse(response);
    }

    protected async threadsRequest(response: DebugProtocol.ThreadsResponse): Promise<void> {
        log.info(`threadsRequest`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }
        const contexts = await this.connection.coordinator.getAllAvailableContexts();
        const threads: DebugProtocol.Thread[] = contexts.map(context => {
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

    protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void {
        log.info(`stackTraceRequest for threadId ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        const contextId: ContextId = args.threadId || 0;
        const context = this.connection.coordinator.getContext(contextId);
        context.getStacktrace().then((trace: StackFrame[]) => {
            const frames = this.frameMap.addFrames(contextId, trace);
            const stackFrames: DebugProtocol.StackFrame[] = frames.map(frame => {
                const result = {
                    column: 0,
                    id: frame.frameId,
                    line: 0,
                    name: '',
                    source: {},
                };

                try {
                    const local = this.sourceMap.toLocalPosition(frame.sourceLine);
                    const localSource = this.sourceMap.getSource(local.source);

                    result.line = local.line;
                    if (localSource) {
                        result.name = localSource.name;
                        result.source = {
                            path: localSource.path,
                            sourceReference: localSource.sourceReference,
                        };
                    }
                } catch (e) {
                    log.error(`stackTraceRequest failed with ${e}`);
                }

                return result;
            });
            response.body = {
                stackFrames,
                totalFrames: trace.length,
            };
            log.info(`stackTraceRequest response.body: ${JSON.stringify(response.body)}`);

            // Update variablesMap
            context.getVariables().then((locals: Variable[]) => {
                log.info('Updating variables map');

                const frame = this.frameMap.getCurrentStackFrame(contextId);
                if (frame === undefined) {
                    log.error('[update variablesMap]: current frame is undefined.');
                    throw new Error('Internal error: Current frame not found.');
                }

                const frameId = frame.frameId;
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

        const scopes: DebugProtocol.Scope[] = [{
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
            const collapsedVariables = variablesContainer.variables.filter((variable) => {
                return variable.name === '___jsrdbg_collapsed___';
            });

            if (collapsedVariables.length > 0) {
                // We have some collapsed variables => send a evaluation request to the debugger
                if (this.connection === undefined) {
                    throw new Error('Internal error: No connection');
                }

                const context = this.connection.coordinator.getContext(variablesContainer.contextId);
                for (const collapsedVariable of collapsedVariables) {
                    if (typeof collapsedVariable.evaluateName === 'undefined' || collapsedVariable.evaluateName === '') {
                        throw new Error(`Internal error: The variable "${collapsedVariable.name}" has no evaluate name.`);
                    }

                    // Request the variable and insert it to the variables map
                    const evaluateName = collapsedVariable.evaluateName.replace(".___jsrdbg_collapsed___", "");
                    const variable = await context.evaluate(evaluateName);
                    this.variablesMap.createVariable(
                        evaluateName.substr(evaluateName.lastIndexOf('.')),
                        JSON.parse(variable.value),
                        variablesContainer.contextId,
                        args.variablesReference,
                        evaluateName
                    );

                    // In the variables container we fetched before is now the collapsed variable and the new variable, so we have to
                    // re-fetch the variables container
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

    protected setVariableRequest(response: DebugProtocol.SetVariableResponse, args: DebugProtocol.SetVariableArguments): void {
        log.info(`setVariableRequest with variablesRequest ${args.variablesReference}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        // Get the variable which we want to set from the variables map
        const variablesContainer: VariablesContainer = this.variablesMap.getVariables(args.variablesReference);
        const variables = variablesContainer.variables.filter((variable) => {
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

        const variable: DebugProtocol.Variable = variables[0];
        if (typeof variable.evaluateName === 'undefined' || variable.evaluateName === '') {
            throw new Error(`Internal error: Variable ${variable.name} has no evaluate name.`);
        }

        const context = this.connection.coordinator.getContext(variablesContainer.contextId);
        context.setVariable(variable.evaluateName, variableValue).then(() => {
            // Everything fine. Replace the variable in the variables map
            variable.value = args.value;
            const index = variablesContainer.variables.indexOf(variables[0]);
            variablesContainer.variables[index] = variable;
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

    protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): void {
        log.info(`evaluateRequest for contextId: ${args.context}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        if (args.frameId === undefined) {
            throw new Error('No frame id passed.');
        }

        const frame = this.frameMap.getStackFrame(args.frameId);
        const context = this.connection.coordinator.getContext(frame.contextId);
        context.evaluate(args.expression).then((variable: Variable) => {
            response.body = {
                result: variable.value,
                type: variable.type,
                variablesReference: 0,
            };

            log.debug('evaluateRequest succeeded');
            this.sendResponse(response);
        }).catch((reason) => {
            log.error(`evaluateRequest failed: ${reason}`);
            response.success = false;
            response.message = `Could not evaluate expression "${args.expression}": ${reason}`;
            this.sendResponse(response);
        });
    }

    protected stepInTargetsRequest(response: DebugProtocol.StepInTargetsResponse, args: DebugProtocol.StepInTargetsArguments): void {
        log.info(`stepInTargetsRequest`);
    }

    protected gotoTargetsRequest(response: DebugProtocol.GotoTargetsResponse, args: DebugProtocol.GotoTargetsArguments): void {
        log.info(`gotoTargetsRequest`);
    }

    protected completionsRequest(response: DebugProtocol.CompletionsResponse, args: DebugProtocol.CompletionsArguments): void {
        log.info(`completionsRequest`);
    }

    /**
     * Apply given config.
     *
     * Currently, only configures the file logger.
     */
    private applyConfig(args: CommonArguments): void {
        if (args.log) {
            Logger.config = args.log;
        }
        log.info(`readConfig: ${JSON.stringify(args)}`);
    }

    /**
     * Print a message in the Debug Console window.
     */
    private debugConsole(message: string): void {
        this.sendEvent(new OutputEvent(message + '\n', 'console'));
    }
}

DebugSession.run(JanusDebugSession);
