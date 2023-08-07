import { Injectable } from '@angular/core';

import { IWSMessage } from '../../@types/global';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    constructor () { }

    private _connection: WebSocket | null;

    private _keepAliveTimer = setInterval(() => {
        this.send('KEEP_ME_ALIVE'); // вот эту строчку бы зашарить с сервером!
    }, 5000);

    public on (host: string): void {
        this._connection = new WebSocket(host); // это сокет-соединение с сервером

        this._connection.onopen = (event) => {
            this.send('Hello from client to server!'); // можно послать строку, Blob или ArrayBuffer
        };

        this._connection.onmessage = (event: MessageEvent<IWSMessage>) => {
            console.log('Клиентом получено сообщение от сервера: ' + event.data); // это сработает, когда сервер пришлёт какое-либо сообщение
        }

        this._connection.onerror = error => {
            console.log('WebSocket error: ', error);
        };

        this._connection.onclose = () => {
            console.log("Соединение с сервером закрыто");
            
            this._connection = null;

            clearInterval(this._keepAliveTimer);
        };
    }

    public send (data: string | Blob | ArrayBuffer): void {
        (this._connection as WebSocket).send(data);
    }
}