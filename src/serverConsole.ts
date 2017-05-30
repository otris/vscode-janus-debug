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

export interface ServerConsoleConfig {
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
}

const log = Logger.create(`ServerConsole`);

export class ServerConsole {

    private conn: SDSConnection;
    private lastSeen: number;

    constructor(private config: ServerConsoleConfig, private out: Output) {
        assert.ok(config.hostname.length !== 0);
        assert.ok(config.port > 0);

        this.lastSeen = 0;
    }

    public async start() {
        return new Promise<void>((resolve, reject) => {
            if (this.conn) {
                resolve();
                return;
            }

            this.out.show();
            log.debug(`connecting to ${this.config.port}:${this.config.hostname}`);

            let sock: Socket;
            try {
                sock = createConnection(this.config.port, this.config.hostname, () => {
                    this.conn = new SDSConnection(sock);

                    this.conn.connect('server-console').then(() => {

                        /*

                        Providing credentials is not necessary but this is a bug:
                        https://redmine.otris.de/issues/20065

                            return conn.changeUser('', '');
                        }).then(userId => {
                            return conn.changePrincipal('');
                        }).then(() => {

                        */

                        return this.conn.getLogMessages(-1);
                    }).then((messages) => {

                        for (const line of messages.lines) {
                            this.print(line);
                        }

                        this.lastSeen = messages.lastSeen;

                    }).then(() => {

                        const pollingInterval = this.config.refreshRate || 3000;
                        let taskIsRunning = false;
                        setInterval(async () => {
                            if (!taskIsRunning) {
                                taskIsRunning = true;
                                await this.conn.getLogMessages(this.lastSeen).then(messages => {
                                    for (const line of messages.lines) {
                                        this.print(line);
                                    }
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
                log.info(`cannot connect to ${this.config.port}:${this.config.hostname}: ` +
                    `${connectError.toString()}`);
                resolve();
                return;
            }

            sock.on('error', (err: Error) => {
                log.error(err.toString());
                reject(err.toString());
            });

            sock.on('close', (hadError: boolean) => {
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

    private print(line: string) {
        this.out.appendLine(`→ ${line}`);
    }
}
