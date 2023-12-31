import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { IWSMessage } from '../../@types/global';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    constructor () { }

    private _connection: WebSocket | null;

    private _keepAliveTimer: any;

    private _currentChunkNumber: number;
    private _slicedFileData: ArrayBuffer[];

    private _progressElement: HTMLDivElement;

    public on (host: string, uploadFileForm: FormGroup, slicedFileData: ArrayBuffer[], newClientId: number): void {
        this._connection = new WebSocket(host + `/:${newClientId}`);

        this._keepAliveTimer = setInterval(() => {
            this.send('KEEP_ME_ALIVE');
        }, 5000);

        this._connection.onopen = () => {
            this._progressElement = document.getElementById('progressBar') as HTMLDivElement;

            this.sendFile(slicedFileData, 0);
        };

        this._connection.onmessage = (event: MessageEvent<IWSMessage>) => {
            const message: IWSMessage = JSON.parse(event.data as unknown as string);
            
            // console.log(`Клиентом получено сообщение от сервера: ${message.event} ----- ${message.text}`);

            if (message.event === 'uploadFile') {
                if (message.text === 'ERROR') {
                    this._clearUploadFileData(uploadFileForm);

                    this._changeProgressBar(message.percentUploaded, true);

                    setTimeout(() => this._changeProgressBar(0), 2000);
                } else if (message.text === 'FINISH') { // console.log(message.percentUploaded);
                    this._changeProgressBar(message.percentUploaded);

                    this._clearUploadFileData(uploadFileForm);

                    setTimeout(() => {
                        this._changeProgressBar(0);

                        const responseMessageElement: HTMLSpanElement = document.getElementById('responseMessage') as HTMLSpanElement;

                        responseMessageElement.textContent = "Файл успешно загружен.";
                    }, 1000);
                } else if (message.text === 'SUCCESS') { // console.log(message.percentUploaded);
                    this._changeProgressBar(message.percentUploaded);

                    this.sendFile(this._slicedFileData, this._currentChunkNumber += 1);
                }
            }
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
        if (this._connection) this._connection.send(data);
    }

    public sendFile (slicedFileData: ArrayBuffer[], chunkNumber: number): void {
        if (!this._slicedFileData || this._slicedFileData.length === 0) this._slicedFileData = slicedFileData;
        
        this._currentChunkNumber = chunkNumber;

        this.send(slicedFileData[chunkNumber]);
    }

    private _changeProgressBar (percentUploaded: number, error = false): void {
        this._progressElement.setAttribute('aria-valuenow', percentUploaded.toString());

        const progressBarElement: HTMLDivElement = this._progressElement.children[0] as HTMLDivElement;

        progressBarElement.style.width = `${percentUploaded}%`;
        progressBarElement.textContent = `${percentUploaded}%`;

        if (error) {
            progressBarElement.classList.add('bg-danger');
            progressBarElement.textContent = "Произошла ошибка при загрузке файла на сервер";
        }
    }

    private _clearUploadFileData (uploadFileForm: FormGroup) {
        uploadFileForm.reset();

        this._slicedFileData = [];
        this._currentChunkNumber = 0;
    }
}