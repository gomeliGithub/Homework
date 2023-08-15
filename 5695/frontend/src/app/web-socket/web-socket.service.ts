import { Injectable } from '@angular/core';

import { IFileData, IWSMessage } from '../../@types/global';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    constructor () { }

    private _connection: WebSocket | null;

    private _keepAliveTimer = setInterval(() => {
        this.send('KEEP_ME_ALIVE'); // вот эту строчку бы зашарить с сервером!
    }, 5000);

    private _slicedFormFile: Blob[];
    private _formFileName: string;
    private _formFileTotalSize: number;
    private _currentChunkNumber: number;

    public on (host: string): void {
        this._connection = new WebSocket(host); // это сокет-соединение с сервером

        this._connection.onopen = (event) => {
            this.send('Hello from client to server!'); // можно послать строку, Blob или ArrayBuffer
        };

        this._connection.onmessage = (event: MessageEvent<IWSMessage>) => {
            const message: IWSMessage = JSON.parse(event.data as unknown as string);
            
            console.log('Клиентом получено сообщение от сервера: ' + message.event + message.data); // это сработает, когда сервер пришлёт какое-либо сообщение

            // if (message.event === 'uploadFile' && message.data === 'SUCCESS') this.sendFile(this._slicedFormFile, this._formFileName, this._formFileTotalSize, this._currentChunkNumber + 1);
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

    public sendFile (fileMetaJson: string, fileData: ArrayBuffer): void {
        const enc  = new TextEncoder(); // always utf-8, Uint8Array()

        const buf1 = enc.encode('!');
        const buf2 = enc.encode(fileMetaJson);
        const buf3 = enc.encode("\r\n\r\n");
        const buf4 = fileData;
    
        let sendData = new Uint8Array(buf1.byteLength + buf2.byteLength + buf3.byteLength + buf4.byteLength);

        sendData.set(new Uint8Array(buf1), 0);
        sendData.set(new Uint8Array(buf2), buf1.byteLength);
        sendData.set(new Uint8Array(buf3), buf1.byteLength + buf2.byteLength);
        sendData.set(new Uint8Array(buf4), buf1.byteLength + buf2.byteLength + buf3.byteLength);
    
        this.send(sendData);
    }
}