'use strict';

import { DebugProtocolTransport } from './transport'

export class DebugConnection {
    private transport: DebugProtocolTransport

    constructor(socket: any /* { Socket } from 'net' */) { }
}