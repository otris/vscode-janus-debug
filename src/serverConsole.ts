import * as assert from 'assert';
import { createConnection, Socket } from 'net';
import { Logger } from 'node-file-log';
import { SDSConnection } from 'node-sds';
import * as path from 'path';
import * as vscode from 'vscode';
import { extend } from './helpers';
import * as version from './version';
import stripJsonComments = require('strip-json-comments');

// tslint:disable-next-line:no-var-requires
const fs = require('fs-extra');

export let consoleObj: ServerConsole;
/**
 * Flag in settings.json (vscode-janus-debug.serverConsole.autoConnect)
 * Note: should be considered in a settings.json watcher.
 */
export let autoConnectServerConsole: boolean;

export interface Output {
    append(value: string): void;
    appendLine(value: string): void;
    clear(): void;
    dispose(): void;
    hide(): void;
    show(preserveFocus?: boolean): void;
    show(column?: any, preserveFocus?: boolean): void;
}

export interface Config {
    /**
     * Hostname or IP address of target server.
     */
    hostname: string;

    /**
     * TCP port of application. Usually 11000.
     */
    port: number;

    /**
     * Number of milliseconds we wait until we poll the server again for new
     * messages. Optional. Default is 3000.
     */
    refreshRate?: number;

    /**
     * Time in milliseconds until we give up trying to connect or waiting
     * for an answer. Optional. Default is 6000.
     */
    timeout?: number;
}

const log = Logger.create(`ServerConsole`);



/**
 * Reads and returns the launch.json file's configurations.
 *
 * This function does essentially the same as
 *
 *     let configs = vscode.workspace.getConfiguration('launch');
 *
 * but is guaranteed to read the configuration from disk the moment it is called.
 * vscode.workspace.getConfiguration function seems instead to return the
 * currently loaded or active configuration which is not necessarily the most
 * current one.
 */
async function getLaunchConfigFromDisk(): Promise<vscode.WorkspaceConfiguration> {

    class Config implements vscode.WorkspaceConfiguration {

        [key: string]: any

        public get<T>(section: string, defaultValue?: T): T {
            // tslint:disable-next-line:no-string-literal
            return this.has(section) ? this[section] : defaultValue;
        }

        public has(section: string): boolean {
            return this.hasOwnProperty(section);
        }

        public async update(section: string, value: any): Promise<void> {
            // Not implemented... and makes no sense to implement
            return Promise.reject(new Error('Not implemented'));
        }

        public inspect<T>(section: string): { key: string; defaultValue?: T; globalValue?: T; workspaceValue?: T } | undefined {
            throw new Error('Not implemented');
        }
    }

    return new Promise<vscode.WorkspaceConfiguration>((resolve, reject) => {
        if (!vscode.workspace.rootPath) {
            // No folder open; resolve with an empty configuration
            return resolve(new Config());
        }

        const filePath = path.resolve(vscode.workspace.rootPath, '.vscode/launch.json');
        fs.readFile(filePath, { encoding: 'utf-8', flag: 'r' }, (err: any, data: any) => {
            if (err) {
                // Silently ignore error and resolve with an empty configuration
                return resolve(new Config());
            }

            const obj = JSON.parse(stripJsonComments(data));
            const config = extend(new Config(), obj);
            resolve(config);
        });
    });
}

/**
 * Connect or re-connect server console.
 *
 * Get launch.json configuration and see if we can connect to a remote
 * server already. Watch for changes in launch.json file.
 */
export async function reconnectServerConsole(console: ServerConsole): Promise<void> {

    let hostname: string | undefined;
    let port: number | undefined;
    let timeout: number | undefined;

    try {
        await console.disconnect();

        const launchJson = await getLaunchConfigFromDisk();  // vscode.workspace.getConfiguration('launch');
        const configs: any[] = launchJson.get('configurations', []);

        for (const config of configs) {
            if (config.hasOwnProperty('type') && config.type === 'janus') {
                hostname = config.host;
                port = config.applicationPort;
                timeout = config.timeout;
                break;
            }
        }
    } catch (error) {
        // Swallow
    }

    if (hostname && port) {
        console.connect({ hostname, port, timeout });
    }
}

export function disconnectServerConsole(console: ServerConsole): void {
    console.disconnect().then(() => {
        console.outputChannel.appendLine(`Disconnected from server`);
    });
}


/**
 * The flag vscode-janus-debug.serverConsole.autoConnect is read
 * once on startup.
 */
export function readAutoConnectServerConsole() {
    const extensionSettings = vscode.workspace.getConfiguration('vscode-janus-debug');
    autoConnectServerConsole = extensionSettings.get('serverConsole.autoConnect', false);
}

export function printVersion(outputChannel: vscode.OutputChannel) {
    if (vscode.workspace !== undefined) {
        outputChannel.appendLine('Extension activated');
        try {
            outputChannel.appendLine("Version: " + version.getVersion().toString(true));
        } catch (err) {
            /* swallow */
        }
    }
}

export function initServerConsole(outputChannel: vscode.OutputChannel) {
    consoleObj = new ServerConsole(outputChannel);
    if (autoConnectServerConsole) {
        reconnectServerConsole(consoleObj);
    }
}



export class ServerConsole {

    private config: Config | undefined;
    private conn: SDSConnection | undefined;
    private lastSeen: number;

    constructor(private out: Output) {
        this.config = undefined;
        this.conn = undefined;
        this.lastSeen = 0;
    }

    public get currentConfiguration(): Config | undefined { return this.config; }

    public get outputChannel(): Output { return this.out; }

    public dispose(): void { this.out.dispose(); }

    public hide(): void { this.out.hide(); }

    public isConnected(): boolean { return this.conn !== undefined; }

    public async connect(config: Config): Promise<void> {
        this.config = config;
        assert.ok(this.config.hostname.length !== 0);
        assert.ok(this.config.port > 0);

        return new Promise<void>((resolve, reject) => {
            if (this.conn !== undefined) {
                resolve();
                return;
            }

            this.out.show();
            log.debug(`connecting to ${config.port}:${config.hostname}`);

            let sock: Socket;
            try {
                sock = createConnection(config.port, config.hostname, () => {
                    this.conn = new SDSConnection(sock);
                    const conn = this.conn;
                    conn.timeout = config.timeout || 6000;
                    conn.connect('server-console').then(() => {

                        /*

                        Providing credentials is not necessary but this is a bug:
                        https://redmine.otris.de/issues/20065

                            return conn.changeUser('', '');
                        }).then(userId => {
                            return conn.changePrincipal('');
                        }).then(() => {

                        */

                        return conn.getLogMessages(-1);
                    }).then((messages) => {

                        for (const line of messages.lines) {
                            this.printLogLine(line);
                        }

                        this.lastSeen = messages.lastSeen;

                    }).then(() => {

                        const pollingInterval = config.refreshRate || 3000;
                        let taskIsRunning = false;
                        const timer = setInterval(async () => {
                            if (!taskIsRunning) {
                                taskIsRunning = true;
                                await conn.getLogMessages(this.lastSeen).then(messages => {
                                    for (const line of messages.lines) {
                                        this.printLogLine(line);
                                    }
                                    this.lastSeen = messages.lastSeen;

                                }).catch(() => {
                                    clearInterval(timer);
                                }).then(() => {
                                    taskIsRunning = false;
                                });
                            }
                        }, pollingInterval);

                    }).catch(((reason: Error | string) => {
                        log.error(`error in 'connect' event handler: ${reason.toString()}`);
                        reject(reason.toString());
                    }));

                });
            } catch (connectError) {
                // Cannot connect; disregard and immediately resolve
                log.info(`cannot connect to ${config.port}:${config.hostname}: ` +
                    `${connectError.toString()}`);
                resolve();
                return;
            }

            sock.on('error', (err: Error) => {
                log.error(err.toString());
                reject(err.toString());
            });

            sock.on('close', (hadError: boolean) => {
                this.out.appendLine('Remote closed the connection');
                let msg = 'remote closed the connection';
                if (hadError) {
                    msg += ' because of an error';
                    log.error(msg);
                    reject(msg);
                } else {
                    log.debug(msg);
                    resolve();
                }
            });
        });
    }

    public async disconnect(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            if (!this.conn) {
                resolve();
            } else {
                await this.conn.disconnect();
                this.conn = undefined;
                resolve();
            }
        });
    }

    private printLogLine(line: string) {
        this.out.appendLine(`→ ${line}`);
    }
}
