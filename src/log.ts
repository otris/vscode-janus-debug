'use strict';

import * as fs from 'fs';

export type LogLevel = 'Debug' | 'Info' | 'Warn' | 'Error';

enum NumericLogLevel { Debug, Info, Warn, Error }

function toNumericLogLevel(logLevel: LogLevel): NumericLogLevel | undefined {
    switch (logLevel) {
        case 'Debug':
            return NumericLogLevel.Debug;

        case 'Info':
            return NumericLogLevel.Info;

        case 'Warn':
            return NumericLogLevel.Warn;

        case 'Error':
            return NumericLogLevel.Error;
    }
}

export interface LogConfiguration {
    /** The name of the logfile. */
    fileName?: string;
    /** The minimum loglevel(s) for messages written to the logfile. */
    logLevel?: { [logName: string]: LogLevel };
}

export class Logger {
    private static loggers = new Map<string, Logger>();
    private static _config: LogConfiguration = {};
    private static fd: number | undefined;
    private static startTime = Date.now();

    private logLevel: NumericLogLevel | undefined;

    constructor(private name: string) {
        this.configure();
        Logger.loggers.set(name, this);
    }

    public debug(msg: string): void { this.log(NumericLogLevel.Debug, 'DEBUG', msg); }

    public info(msg: string): void { this.log(NumericLogLevel.Info, 'INFO', msg); }

    public warn(msg: string): void { this.log(NumericLogLevel.Warn, 'WARN', msg); }

    public error(msg: string): void { this.log(NumericLogLevel.Error, 'ERROR', msg); }

    public static create(name: string): Logger {
        return new Logger(name);
    }

    public static set config(newConfig: LogConfiguration) {
        if (Logger.fd !== undefined) {
            fs.closeSync(Logger.fd);
            Logger.fd = undefined;
        }

        Logger._config = newConfig;
        if (Logger._config.fileName) {
            try {
                Logger.fd = fs.openSync(Logger._config.fileName, 'w');
            } catch (e) {
                // swallow
            }
        }

        Logger.loggers.forEach((logger) => logger.configure());
    }

    private log(level: NumericLogLevel, displayLevel: string, msg: string): void {
        if (level < this.logLevel) {
            return;
        }

        const elapsedTime = (Date.now() - Logger.startTime) / 1000;
        let elapsedTimeString = elapsedTime.toFixed(3);
        while (elapsedTimeString.length < 9) {
            elapsedTimeString = '0' + elapsedTimeString;
        }
        const logLine = displayLevel + '|' + elapsedTimeString + '|' + this.name + ': ' + msg;

        if ((Logger.fd !== undefined)) {
            fs.write(Logger.fd, logLine + '\n');
        }
    }

    private configure(): void {
        this.logLevel = undefined;
        if (Logger._config.fileName && Logger._config.logLevel) {
            this.logLevel = toNumericLogLevel(Logger._config.logLevel[this.name]);
            if (this.logLevel === undefined) {
                this.logLevel = toNumericLogLevel(Logger._config.logLevel['default']);
            }

            if (this.logLevel === undefined) {
                this.logLevel = NumericLogLevel.Info;
            }
        }
    }
}