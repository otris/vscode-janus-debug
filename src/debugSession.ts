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
    private ipcClient: DebugAdapterIPC;
    private displaySourceNoticeCount = 0;
    private terminateOnDisconnect = false;
    private breakOnAttach = false;


    public constructor() {
        super();
        this.connection = undefined;
        this.sourceMap = new SourceMap();
        this.frameMap = new FrameMap();
        this.variablesMap = new VariablesMap();
        this.ipcClient = new DebugAdapterIPC();
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
        log.info(`disconnectRequest`);

        const connection = this.connection;
        if (!connection) {
            this.sendResponse(response);
            return;
        }

        const contexts = await connection.coordinator.getAllAvailableContexts();
        const existContext = contexts.find(context => (context.id === this.attachedContextId));
        if (existContext) {
            if (this.config === 'launch' || this.terminateOnDisconnect) {
                if (existContext.isStopped()) {
                    log.debug(`Terminating debuggee (${this.attachedContextId})`);
                } else {
                    log.warn(`Trying to terminate debuggee (${this.attachedContextId}) will fail, because it's not stopped`);
                }
                await connection.sendRequest(new Command('stop', this.attachedContextId));
            }
        } else if (this.attachedContextId) {
            log.debug(`Debuggee (${this.attachedContextId}) not running anymore`);
        }

        await connection.sendRequest(new Command('exit'));
        await connection.disconnect();

        this.attachedContextId = undefined;
        this.config = undefined;
        this.connection = undefined;
        this.sendResponse(response);
    }

    // protected async terminateRequest(response: DebugProtocol.TerminateResponse, args: DebugProtocol.TerminateArguments): Promise<void> {
    //     log.info(`terminateRequest`);
    //     this.sendResponse(response);
    // }
    // protected async terminateThreadsRequest(response: DebugProtocol.TerminateThreadsResponse, args: DebugProtocol.TerminateThreadsRequest): Promise<void> {
    //     log.info(`terminateThreadsRequest`);
    //     this.sendResponse(response);
    // }

    protected async launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments): Promise<void> {
        this.applyConfig(args);
        log.info(`launchRequest`);

        this.connection = undefined;
        this.sourceMap = new SourceMap();
        this.frameMap = new FrameMap();
        this.variablesMap = new VariablesMap();
        this.config = 'launch';

        log.debug(`my workspace: ${args.workspace}`);

        const sdsPort: number = args.applicationPort || 10000;
        const debuggerPort = args.debuggerPort || 8089;
        const host: string = args.host || 'localhost';
        const username: string = args.username || '';
        const principal: string = args.principal || '';
        const password = args.password.length > 0 ? crypt_md5(args.password, 'o3') : '';
        const stopOnEntry = args.stopOnEntry;
        const include = args.localSources ? args.localSources.include : undefined;
        const exclude = args.localSources ? args.localSources.exclude : undefined;

        let scriptIdentifier: string | undefined;

        if (!args.script || typeof args.script !== 'string' || args.script.length === 0) {
            log.error(`launchRequest failed: no script specified by user`);
            response.success = false;
            response.message = `No script to launch.`;
            this.sendResponse(response);
            return;
        }

        const source = new LocalSource(args.script);

        let uris: string[] | undefined;
        try {
            await this.ipcClient.connect(args.processId);
            uris = await this.ipcClient.findURIsInWorkspace(include, exclude);
            // log.debug(`found ${JSON.stringify(uris)} URIs in workspace`);
            this.sourceMap.setLocalUrls(uris);
        } catch (e) {
            log.error(`launchRequest failed: ${e}`);
            response.success = false;
            response.message = `Launch failed: ${e}`;
            this.sendResponse(response);
            return;
        }

        const connectDebugger = async () => {
            // Attach to debugger port and tell the frontend that we are ready to set breakpoints.
            const debuggerSocket = connect(debuggerPort, host);

            if (this.connection) {
                log.warn("launchRequest: already made a connection to remote debugger");
            }

            const connection = new DebugConnection(debuggerSocket);
            this.connection = connection;

            // this.logServerVersion();

            this.connection.on('contextPaused', (contextId: number) => {
                if (this.attachedContextId !== undefined && this.attachedContextId === contextId) {
                    // todo: this is not only called when breakpoint is set
                    // this is called every time, when the debugger stops...
                    // so also after next, step-in, step-out, ...
                    this.reportStopped('breakpoint', contextId);
                }
            });

            this.connection.on('error', (reason: string) => {
                log.error(`Error when connecting to remote debugger: ${reason}`);
                response.success = false;
                response.message = reason;
                this.sendResponse(response);
                this.connection = undefined;
                this.sendEvent(new TerminatedEvent());
            });

            debuggerSocket.on('connect', async () => {

                log.info(`connected to ${host}:${debuggerPort}`);

                if (scriptIdentifier) {
                    this.sourceMap.addMapping(source, scriptIdentifier);
                } else {
                    this.sourceMap.addMapping(source, source.sourceName());
                }

                const sourceUrl = scriptIdentifier ? scriptIdentifier : source.sourceName();

                const contexts = await connection.coordinator.getAllAvailableContexts();
                const nameContexts = contexts.filter(context => (context.name === sourceUrl));
                // log.info(`available contexts: ${contexts.length}`);
                if (nameContexts.length < 1) {
                    response.success = false;
                    response.message = `Could not launch remote script: no script with name ${sourceUrl} found`;
                    this.sendResponse(response);
                    return;
                }
                nameContexts.sort((c1, c2) => (c1.id - c2.id));
                const numContexts = nameContexts.length;
                const selectedContext = nameContexts[numContexts - 1];

                // get source code from the context on server
                try {
                    const remoteSource = await connection.sendRequest(Command.getSource(selectedContext.name, selectedContext.id),
                        async (res: Response) => {
                            // log.info(`getSource response: ${JSON.stringify(res)}`);
                            if (res.type === 'error') {
                                if (res.content.hasOwnProperty('message')) {
                                    throw new Error(res.content.message);
                                } else {
                                    throw new Error('Unknown error');
                                }
                            }
                            return res.content.source;
                        });
                    // log.info(`retrieved server source: ${JSON.stringify(remoteSource.source)} id: ${remoteSource.id} script: ${remoteSource.script}`);
                    this.sourceMap.serverSource = ServerSource.fromSources(source.sourceName(), remoteSource, true);
                } catch (e) {
                    log.error(`Command.getSource failed ${e}`);
                }

                // there can be more than one contexts with same name
                // (e.g., if the user started the script several times, the user also
                // could have changed the code, so: )
                // we should attach to the context that we got the source code from
                // and the context must be stopped
                nameContexts.forEach(async context => {
                    if (context.id === selectedContext.id && context.isStopped()) {
                        this.attachedContextId = context.id;
                    }
                });

                log.debug(`selected context '${selectedContext.name}' (${selectedContext.id})`);
                if (this.attachedContextId === undefined) {
                    response.success = false;
                    response.message = `Could not launch remote script '${sourceUrl}': unexpected error`;
                    this.sendResponse(response);
                    return;
                }

                this.sendEvent(new InitializedEvent());
                this.debugConsole(`Connected to remote debugger on ${host}:${debuggerPort}`);
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
            // log.info(`Script is already running on DOCUMENTS server, just connect the debugger`);
            await connectDebugger();
        } else {
            const sdsSocket = connect(sdsPort, host);
            const sdsConnection = new SDSConnection(sdsSocket);
            sdsConnection.timeout = args.timeout || 6000;

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
                        scriptSource = 'debugger;\n' + scriptSource;
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

                }).then(() => {
                    return new Promise(resolve => {
                        setTimeout(resolve, 1500);
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

        this.connection = undefined;
        this.sourceMap = new SourceMap();
        this.frameMap = new FrameMap();
        this.variablesMap = new VariablesMap();
        this.config = 'attach';
        this.terminateOnDisconnect = args.terminateOnDisconnect;
        this.breakOnAttach = args.breakOnAttach;

        const include = args.localSources ? args.localSources.include : undefined;
        const exclude = args.localSources ? args.localSources.exclude : undefined;

        log.debug(`my workspace: ${args.workspace}`);

        let uris: string[] | undefined;
        try {
            await this.ipcClient.connect(args.processId);
            uris = await this.ipcClient.findURIsInWorkspace(include, exclude);
            // log.debug(`found ${JSON.stringify(uris)} URIs in workspace`);
            this.sourceMap.setLocalUrls(uris);
        } catch (e) {
            log.error(`attachRequest failed: ${e}`);
            response.success = false;
            response.message = `Attach failed: ${e}`;
            this.sendResponse(response);
            return;
        }

        const port: number = args.debuggerPort || 8089;
        const host: string = args.host || 'localhost';
        const socket = connect(port, host);

        if (this.connection) {
            log.warn("attachRequest: already made a connection");
        }

        const connection = new DebugConnection(socket);
        this.connection = connection;

        this.connection.on('contextPaused', (contextId: number) => {
            if (this.attachedContextId !== undefined && this.attachedContextId === contextId) {
                // todo: this is not only called when breakpoint is set
                // this is called every time, when the debugger stops...
                // so also after next, step-in, step-out, ...
                this.reportStopped('breakpoint', contextId);
            }
        });

        this.connection.on('error', (reason: string) => {
            // TODO: duplicate on-error function
            log.error(`Error on connection: ${reason}`);
            response.success = false;
            response.message = reason;
            this.sendResponse(response);
            this.connection = undefined;
            this.sendEvent(new TerminatedEvent());
        });

        // this.logServerVersion();

        socket.on('connect', async () => {
            log.info(`connected to ${host}:${port}`);

            try {
                if (this.connection) {
                    const contexts: Context[] = await this.connection.coordinator.getAllAvailableContexts();

                    // sort contexts by ids meaning by starting time
                    // that might help the user when they must select one from list
                    contexts.sort((c1, c2) => (c1.id - c2.id));

                    // log.info(`available contexts: ${contexts.length}`);
                    if (contexts.length < 1) {
                        throw new Error("no context found to attach to");
                    } else {
                        let targetContext: Context;
                        if (contexts.length > 1) {
                            const contextNames = contexts.map(context => context.name);
                            const quickPickList = contextNames;
                            const terminateAll = "<Terminate all paused scripts>";
                            quickPickList.push(terminateAll);
                            const targetContextName = await this.ipcClient.showContextQuickPick(quickPickList);
                            if (targetContextName === terminateAll) {
                                connection.sendRequest(new Command("stop"));
                                response.success = false;
                                response.message = "Terminated all paused scripts";
                                this.sendResponse(response);
                                return;
                            }
                            // log.info(`got ${targetContextName} to attach to`);
                            const targetContexts = contexts.filter(context => context.name === targetContextName);
                            targetContext = targetContexts[0];
                        } else {
                            targetContext = contexts[0];
                        }
                        if (targetContext === undefined) {
                            throw new Error("no context selected to attach to");
                        }

                        log.debug(`selected context '${targetContext.name}' (${targetContext.id})`);
                        try {
                            const sources = await connection.sendRequest(Command.getSource(targetContext.name, targetContext.id),
                                async (res: Response) => {
                                    // log.debug(`getSource response: ${JSON.stringify(res)}`);
                                    if (res.type === 'error') {
                                        if (res.content.hasOwnProperty('message')) {
                                            throw new Error(res.content.message);
                                        } else {
                                            throw new Error('Unknown error');
                                        }
                                    }
                                    return res.content.source;
                                });
                            // log.info(`retrieved server sources: ${JSON.stringify(sources)}`);
                            const localSource = this.sourceMap.getSource(targetContext.name);
                            this.sourceMap.serverSource = ServerSource.fromSources(targetContext.name, sources, false, localSource);

                        } catch (e) {
                            log.error(`Command.getSource failed: ${e}`);
                            throw new Error(e.message);
                        }

                        this.attachedContextId = targetContext.id;
                        // if the script is paused, we must notify VS Code to get the
                        // debugging information in the UI
                        if (targetContext.isStopped()) {
                            // todo: move this reportStopped to configurationDoneRequest
                            // this.reportStopped('pause', targetContext.id);
                        } else if (this.breakOnAttach && this.connection) {
                            // Due to a problem in VS Code, the user cannot use the pause button
                            // before the stoppedEvent was sent to VS Code.
                            // Sending the stoppedEvent is triggered by the response of the pause request.
                            log.info("sending 'pause' request to remote");
                            await this.connection.sendRequest(new Command('pause', this.attachedContextId));
                        } else {
                            log.warn(`context ${this.attachedContextId} not paused`);
                        }
                    }
                } else {
                    throw new Error(`not connected to a remote debugger`);
                }

            } catch (e) {
                log.error(`attachRequest failed: ${e}`);
                response.success = false;
                response.message = `Attach failed: ${e}`;
                this.sendResponse(response);
                return;
            }


            // Tell the frontend that we are ready to set breakpoints and so on. The frontend will end the
            // configuration sequence by calling 'configurationDone' request
            this.sendEvent(new InitializedEvent());
            this.debugConsole(`Connected to remote debugger on ${host}:${port}`);
            this.sendResponse(response);
        });

        socket.on('close', async (hadError: boolean) => {
            await this.ipcClient.disconnect();

            if (hadError) {
                log.error(`remote closed the connection due to error`);
            } else {
                log.info(`remote closed the connection`);
            }
            this.connection = undefined;
            this.sendEvent(new TerminatedEvent());
        });

        socket.on('error', async (err: any) => {
            // TODO: duplicate on-error function
            log.error(`failed to connect to ${host}:${port}: ${err.code}`);
            await this.ipcClient.disconnect();

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
        log.info(`setBreakPointsRequest for ${numberOfBreakpoints} breakpoint(s)`);
        // log.info(`setBreakPointsRequest for ${numberOfBreakpoints} breakpoint(s): ${JSON.stringify(args)}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }
        const conn = this.connection;

        if (numberOfBreakpoints === 0) {
            // Empty array specified, clear all breakpoints for the source

            try {
                const deleteAllBreakpointsCommand = new Command('delete_all_breakpoints');
                await conn.sendRequest(deleteAllBreakpointsCommand, async (res: Response) => {
                    if (res.type === 'error') {
                        log.error(`delete_all_breakpoints failed with: '${res.content.message}'`);
                        throw new Error(`Target responded with error '${res.content.message}'`);
                    }
                });

                log.debug(`setBreakPointsRequest succeeded: cleared all breakpoints`);
                response.body = {
                    breakpoints: []
                };
                response.success = true;
                this.sendResponse(response);

            } catch (e) {

                log.error(`setBreakPointsRequest failed: ${e}`);
                response.success = false;
                response.message = `Could not clear breakpoint(s): ${e}`;
                this.sendResponse(response);
            }

            // Done
            return;
        }

        if (!args.breakpoints || !args.source.path) {
            log.debug(`setBreakPointsRequest failed: ${JSON.stringify(args)}`);
            response.success = false;
            response.message = `An internal error occurred`;
            this.sendResponse(response);
            return;
        }

        let remoteSourceUrl = "";
        if (this.attachedContextId !== undefined) {
            remoteSourceUrl = await this.connection.coordinator.getContext(this.attachedContextId).name;
        } else {
            const localUrl: string = args.source.path;
            remoteSourceUrl = this.sourceMap.getRemoteUrl(localUrl);
        }
        // log.debug(`setBreakPointsRequest remoteSourceUrl: ${remoteSourceUrl}`);
        const actualBreakpoints: Array<Promise<Breakpoint>> = [];
        const source = path.parse(args.source.path).name;
        const requestedBreakpoints = args.breakpoints;
        requestedBreakpoints.forEach((breakpoint => {
            try {
                const remoteLine = this.sourceMap.toRemoteLine({
                    source,
                    line: breakpoint.line
                });
                const setBreakpointCommand = Command.setBreakpoint(remoteSourceUrl, remoteLine, false, this.attachedContextId);

                actualBreakpoints.push(
                    conn.sendRequest(setBreakpointCommand, (res: Response): Promise<Breakpoint> => {
                        return new Promise<Breakpoint>((resolve, reject) => {
                            // When the debugger give a error back but send a message that a breakpoint
                            // cant set, we do no reject but make the specific breakpoint unverified.
                            // We do this by passing a new breakpoint to the resolve function with the
                            // pending attribute set to false.
                            if ((res.type === 'error' && res.content.message) && (res.content.message === 'Cannot set breakpoint at given line.')) {
                                log.info(`cannot set breakpoint at ${breakpoint.line} (remote ${remoteLine})`);
                                return resolve({
                                    line: remoteLine,
                                    pending: false,
                                } as Breakpoint);
                            }
                            // When the debugger give a error back and the message
                            // dont tell us that a breakpoint cant set we reject this one, cause a 'unknown'
                            // error occur.
                            // That results in a complete reject of every breakpoint.
                            if ((res.type === 'error') && res.content.message && (res.content.message !== 'Cannot set breakpoint at given line.')) {
                                reject(new Error(`Target responded with error '${res.content.message}'`));
                            } else {
                                // The debug engine tells us that the current breakpoint can set, so
                                // the breakpoint will verified in vscode.
                                res.content.pending = true;
                                // log.info(`set breakpoint at requested line ${remoteLine} response line ${res.content.line} local line ${breakpoint.line}`);
                                resolve(res.content);
                            }
                        });
                    }));
                } catch (err) {
                    log.debug(`setBreakPointsRequest ${err}`);
                }
        }));

        Promise.all(actualBreakpoints).then((res: Breakpoint[]) => {
            const breakpoints: DebugProtocol.Breakpoint[] = res.map(actualBreakpoint => {
                const localPos = this.sourceMap.toLocalPosition(actualBreakpoint.line, remoteSourceUrl);
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
            // log.debug(`setBreakPointsRequest succeeded: ${JSON.stringify(breakpoints)}`);
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
        this.sendResponse(response);
    }

    protected async configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments): Promise<void> {
        log.info("configurationDoneRequest");

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        // we only consider the attached contxt for now
        if (this.attachedContextId) {

            if (this.sourceMap.serverSource.hiddenStatement) {
                // if the server source contains the internal "debugger;" statement, execute single step,
                // stopped event will be sent after script has been stopped
                log.debug(`'debugger;' statement -> sending 'next' to remote`);
                await this.connection.sendRequest(new Command('next', this.attachedContextId));
            } else {
                log.info("no 'debugger;' statement -> check attached context");
                if (this.connection.coordinator.getContext(this.attachedContextId).isStopped()) {
                    this.reportStopped('pause', this.attachedContextId);
                }
            }
        } else {
            log.info("no attached context");
        }

        this.connection.on('newContext', (contextId: number, contextName: string, stopped: boolean) => {
            log.info(`new context on target: ${contextId}, context name: "${contextName}", stopped: ${stopped}`);
        });

        this.sendResponse(response);
    }

    protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
        log.info(`continueRequest`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        const contextId: ContextId = args.threadId || 0;
        let context: Context;
        try {
            context = this.connection.coordinator.getContext(contextId);
        } catch (e) {
            log.warn(`continueRequest getContext: ${e}`);
            if (e.message.startsWith('No such context')) {
                this.connection.sendRequest(new Command('exit'));
            }
            return;
        }

        context.continue().then(() => {
            // log.debug('continueRequest succeeded');

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

    /**
     * When 'next' is executed, the debugger stops and sends a stop response.
     * This triggeres 'this.connection.on('contextPaused')' where reportStopped() is called.
     * reportStopped() tells vscode that the debugger has stopped.
     * After vscode gets the stopped event, it calls some functions like getStacktrace, getScope, etc.
     * See last section in this documentation for further information:
     * https://code.visualstudio.com/docs/extensionAPI/api-debugging#_the-debug-adapter-protocol-in-a-nutshell
     */
    protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void {
        log.info(`nextRequest for threadId: ${args.threadId}`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        const contextId: ContextId = args.threadId || 0;

        let context: Context;
        try {
            context = this.connection.coordinator.getContext(contextId);
        } catch (e) {
            log.warn(`nextRequest getContext: ${e}`);
            if (e.message.startsWith('No such context')) {
                this.connection.sendRequest(new Command('exit'));
            }
            return;
        }

        context.next().then(() => {
            // log.debug('nextRequest succeeded');
            response.success = true;
            this.sendResponse(response);
            // reportStopped is called in this.connection.on('contextPaused'),
            // that is when debugger has really stopped
            // this.reportStopped('step', contextId);
        }, err => {
            log.error('nextRequest failed: ' + err);
            response.success = false;
            response.message = err.toString();
            this.sendResponse(response);
        });
    }

    protected async stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): Promise<void> {
        log.info(`stepInRequest`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        const contextId: ContextId = args.threadId || 0;
        const context = this.connection.coordinator.getContext(contextId);

        try {
            // We have to step in twice to get the correct stack frame
            await context.stepIn();
            // log.debug('first stepInRequest succeeded');
            response.success = true;
            this.sendResponse(response);
            // todo: see 'next'
            // this.reportStopped('step in', contextId);
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
            // log.debug('first stepOutRequest succeeded');
            response.success = true;
            this.sendResponse(response);
            // todo: debugger does not send stop event on step out,
            // this means that the debugger has not stopped after the step out request,
            // so we cannot call reportStopped here, because it's simply not true
            // this.reportStopped('step out', contextId);
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
        log.info(`pauseRequest`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        try {
            const contextId: ContextId = args.threadId || 0;

            const context = this.connection.coordinator.getContext(contextId);
            context.pause().then(() => {
                // log.debug('pauseRequest succeeded');
                response.success = true;
                this.sendResponse(response);
                // in context.pause() the stopped notification is catched
                // by another handler, so connection.handleResponse
                // does not send the stopped report to vs code also the
                // pause handler does not send it
                // note:
                // do not move reportStopped to the pause-handler for now
                // because we want to keep a chance to NOT notify vs code
                // (but not sure yet, if this will really be required...)
                this.reportStopped('pause', contextId);
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

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        response.body = {
            content: this.sourceMap.serverSource.getSourceCode(),
            mimeType: 'text/javascript'
        };

        this.sendResponse(response);
    }

    /**
     * Only return the attached context id here, we attached to only one
     * context in attach or launch.
     */
    protected async threadsRequest(response: DebugProtocol.ThreadsResponse): Promise<void> {
        log.info(`threadsRequest`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        response.body = {
            threads: [],
        };

        if (this.attachedContextId !== undefined) {

            let attachedContext: Context;
            try {
                attachedContext = this.connection.coordinator.getContext(this.attachedContextId);
            } catch (e) {
                log.warn(`threadsRequest getContext: ${e}`);
                if (e.message.startsWith('No such context')) {
                    // see description in stackTraceRequest()
                    this.connection.sendRequest(new Command('exit'));
                }
                return;
            }
            response.body.threads.push({
                id: this.attachedContextId,
                name: attachedContext.name
            });
        }
        // log.debug(`threadsRequest succeeded with ${JSON.stringify(response.body.threads)}`);
        this.sendResponse(response);
    }

    protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void {
        log.info(`stackTraceRequest`);

        if (this.connection === undefined) {
            throw new Error('No connection');
        }

        // get the context
        const contextId: ContextId = args.threadId || 0;
        let context: Context;
        try {
            context = this.connection.coordinator.getContext(contextId);
            if (context.name.length === 0) {
                log.error(`Found context with id ${contextId}, but it has no name`);
            }
        } catch (e) {
            log.warn(`stackTraceRequest getContext: ${e}`);
            if (e.message.startsWith('No such context')) {
                // Remote probably finished without telling us. This worked some time ago.
                // However, stopping here should be correct, because the debugger is only
                // connected to one special context. And this context does not exist anymore.
                this.connection.sendRequest(new Command('exit'));
            }
            return;
        }

        // get the stacktrace and create the stackframes
        // with the current local position
        context.getStacktrace().then((trace: StackFrame[]) => {

            // create the frames
            const frames = this.frameMap.addFrames(contextId, trace);
            if (frames.length > 0 && frames.length < trace.length) {
                const serverSourceLine = this.sourceMap.serverSource.getSourceLine(frames[0].sourceLine);
                log.debug(`server line: '${serverSourceLine}'`);
            }
            const stackFrames: Array<Promise<DebugProtocol.StackFrame>> = frames.map(async frame => {
                if (this.connection === undefined) {
                    // not expected here
                    throw new Error('No connection');
                }

                // this default result is actually not used
                const result: DebugProtocol.StackFrame = {
                    column: 0,
                    id: frame.frameId,
                    name: '',
                    line: 0
                };


                try {
                    let localPos;
                    log.debug(`context '${context.name}' frame: url '${frame.sourceUrl}' line ${frame.sourceLine}`);


                    // 'required' scripts
                    // get all source codes from server here
                    // it's useful to know them in setBreakpointsRequest
                    // const urls = await this.connection.sendRequest(new Command('get_all_source_urls'), async (res: Response) => res.content.urls);
                    // log.debug(`all urls ${JSON.stringify(urls)}`);

                    if (frame.sourceUrl !== context.name) {
                        if (!this.sourceMap.getDynamicServerSource(frame.sourceUrl)) {
                            const dynamicSource = await this.connection.sendRequest(Command.getSource(frame.sourceUrl, this.attachedContextId), async (res: Response) => res.content.source);
                            // log.info(`retrieved dynamic server sources: ${JSON.stringify(dynamicSource)}`);
                            const serverSource = ServerSource.fromSources(frame.sourceUrl, dynamicSource);
                            this.sourceMap.addDynamicScript(frame.sourceUrl, serverSource);
                        }
                    }

                    localPos = this.sourceMap.toLocalPosition(frame.sourceLine, frame.sourceUrl);
                    log.info(`position: line ${localPos.line} in file '${localPos.source}'`);


                    const localSource = this.sourceMap.getSource(localPos.source);
                    if (!localSource) {
                        // when local source not available toLocalPosition() should
                        // have thrown an exception
                        throw new Error("Unexpected error");
                    }

                    // local source found
                    result.line = localPos.line;
                    result.name = localSource.name;
                    result.source = {
                        presentationHint: 'emphasize',
                        path: localSource.path,
                        sourceReference: localSource.sourceReference
                    };
                } catch (e) {
                    const contextFile = this.sourceMap.getSource(context.name);
                    // if contextFile is undefined, line must be 0
                    result.line =  contextFile ? 1 : 0;
                    result.name = `not available`;
                    result.source =  contextFile ? {
                        presentationHint: 'normal',
                        path: contextFile.path,
                        sourceReference: contextFile.sourceReference
                    } : undefined;

                    log.error(`no local position for '${context.name}': ${e}`);
                    if (this.displaySourceNoticeCount < 1) {
                        // or simply use e.message here?
                        this.ipcClient.displaySourceNotice(`Source mismatch: try using Breakpoints and Continue. More information in log file.`);
                        this.displaySourceNoticeCount++;
                    }
                }
                return result;
            });

            Promise.all(stackFrames).then(result => {
                // return the created stackframes to vscode
                response.body = {
                    stackFrames: result,
                    totalFrames: trace.length,
                };
                // log.debug(`stackTraceRequest succeeded response.body: ${JSON.stringify(response.body)}`);
                response.success = true;
                this.sendResponse(response);
            });
        }).catch(reason => {
            log.debug(`stackTraceRequest failed: ${reason}`);
            response.success = false;
            this.sendResponse(response);
        });
    }

    /**
     * See: https://code.visualstudio.com/docs/extensionAPI/api-debugging#_the-debug-adapter-protocol-in-a-nutshell
     */
    protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void {
        log.info(`scopesRequest`);

        if (this.connection === undefined) {
            throw new Error('Internal error: No connection');
        }
        const frame = this.frameMap.getStackFrame(args.frameId);
        const contextId: ContextId = frame.contextId;
        const context = this.connection.coordinator.getContext(contextId);

        // The variablesReference is just the frameId because we do not keep track of individual scopes in a frame.
        // vscode only calls variablesRequest() when variablesReference > 0, the frame ids start with 0, so add 1.
        // We use the frameId, because the variableReference must be different for each scope
        // the frameId itself is not used in variablesMap
        const frameRef = frame.frameId + 1;

        // Update variablesMap
        context.getVariables().then(async (locals: Variable[]) => {
            // log.info(`updating variables map for ${locals.length} variables`);

            // use await with createVariable()! because createVariable cannot be called parallel
            // use for...of instead of forEach because forEach does not wait!
            for (const variable of locals) {
                await this.variablesMap.createVariable(variable.name, variable.value, contextId, context, frameRef);
            }

            const scopes: DebugProtocol.Scope[] = [{
                expensive: false,
                name: 'Locals',
                variablesReference: frameRef,
            }];
            response.body = {
                scopes,
            };
            response.success = true;
            // log.info(`scopesRequest succeeded`);
            this.sendResponse(response);
        }).catch(reason => {
            log.error(`could not update variablesMap: ${reason}`);
            response.success = false;
            log.info(`scopesRequest failed`);
            this.sendResponse(response);
        });
    }

    protected async variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): Promise<void> {
        log.info(`variablesRequest ${args.variablesReference}`);
        if (this.connection === undefined) {
            throw new Error('Internal error: No connection');
        }

        try {
            // Get variables from the variables map
            let variablesContainer = this.variablesMap.getVariables(args.variablesReference);
            // variablesContainer.variables.forEach((variable) => {
            //     log.info(`variable: ${JSON.stringify(variable)}`);
            // });
            const context = this.connection.coordinator.getContext(variablesContainer.contextId);
            if (variablesContainer.parentId !== undefined && variablesContainer.variableName !== undefined) {
                // this conainer belongs to an object and we have to add the object members
                await this.variablesMap.addObjectMembers(context, variablesContainer);
            }

            // Check if the returned variables container contains a object variable that is collapsed.
            // If so, we have to request the debugger to evaluate this variable.
            const collapsedVariables = variablesContainer.variables.filter((variable) => {
                return variable.name === '___jsrdbg_collapsed___';
            });

            if (collapsedVariables.length > 0) {
                // We have some collapsed variables => send a evaluation request to the debugger

                for (const collapsedVariable of collapsedVariables) {
                    if (typeof collapsedVariable.evaluateName === 'undefined' || collapsedVariable.evaluateName === '') {
                        throw new Error(`Internal error: The variable "${collapsedVariable.name}" has no evaluate name.`);
                    }

                    // Request the variable and insert it to the variables map
                    const evaluateName = collapsedVariable.evaluateName.replace(".___jsrdbg_collapsed___", "");
                    const variable = await context.evaluate(evaluateName);
                    await this.variablesMap.createVariable(
                        evaluateName.substr(evaluateName.lastIndexOf('.')),
                        JSON.parse(variable.value),
                        variablesContainer.contextId,
                        context,
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

            response.success = true;
            response.body = {
                variables: variablesContainer.variables
            };
            // log.debug(`variablesRequest succeeded`);

        } catch (e) {
            log.error(`variablesRequest failed: ${e}`);
            response.success = false;
            response.message = e.message;
        }

        this.sendResponse(response);
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
        // log.info(`evaluateRequest for ${args.expression}`);

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

            // log.debug('evaluateRequest succeeded');
            this.sendResponse(response);
        }).catch((reason) => {
            // log.error(`evaluateRequest failed: ${reason}`);
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
        // log.info(`readConfig: ${JSON.stringify(args)}`);
    }

    /**
     * Print a message in the Debug Console window.
     */
    private debugConsole(message: string): void {
        this.sendEvent(new OutputEvent(message + '\n', 'console'));
    }

    private reportStopped(reason: string, contextId: number): void {
        log.debug(`sending 'stopped' to VS Code`);
        this.sendEvent(new StoppedEvent(reason, contextId));
    }
}

DebugSession.run(JanusDebugSession);
