import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { WebSocketService } from './web-socket/web-socket.service';

import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    constructor (private readonly webSocketService: WebSocketService) { }

    private _socketServerHost: string = environment.webSocketURL;

    public uploadFile (formFile: File, uploadFileForm: FormGroup) {
        const reader = new FileReader();

        reader.onload = event => {
            const fileData: ArrayBuffer = (event.target as FileReader).result as ArrayBuffer;

            const slicedFileData: ArrayBuffer[] = [];

            for (let i = 0; i <= fileData.byteLength; i += 100000) {
                slicedFileData.push(fileData.slice(i, i + 100000));
            } 

            this.webSocketService.on(this._socketServerHost, uploadFileForm, slicedFileData);
        }

        reader.readAsArrayBuffer(formFile);
    }
}