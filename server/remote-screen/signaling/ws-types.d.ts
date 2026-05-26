declare module 'ws' {
  import type { IncomingMessage, Server as HttpServer } from 'node:http';

  export type RawData = string | Buffer | ArrayBuffer | Buffer[];

  export default class WebSocket {
    static readonly OPEN: number;
    constructor(url: string);
    readonly OPEN: number;
    readyState: number;
    send(data: string): void;
    close(): void;
    on(event: 'open', listener: () => void): this;
    on(event: 'message', listener: (data: RawData) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
  }

  export class WebSocketServer {
    clients: Set<WebSocket>;
    constructor(options: { server: HttpServer });
    on(event: 'connection', listener: (socket: WebSocket, request: IncomingMessage) => void): this;
    close(callback?: (error?: Error) => void): void;
  }
}
