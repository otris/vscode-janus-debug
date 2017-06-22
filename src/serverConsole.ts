'use strict';

import * as assert from 'assert';
import { createConnection, Socket } from 'net';
import { crypt_md5, SDSConnection } from 'node-sds';
import { Logger } from './log';

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
                        setInterval(async () => {
                            if (!taskIsRunning) {
                                taskIsRunning = true;
                                await conn.getLogMessages(this.lastSeen).then(messages => {
                                    for (const line of messages.lines) {
                                        this.printLogLine(line);
                                    }
                                    this.lastSeen = messages.lastSeen;

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
