import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup } from '@angular/forms';

import { Observable } from 'rxjs';

import { WebSocketService } from '../web-socket/web-socket.service';

import { environment } from '../../environments/environment';

import { IFileInfoWithComments } from '../../@types/global';

@Injectable({
    providedIn: 'root'
})
export class DownloadedFilesListComponentService {
    constructor (
        private readonly http: HttpClient,
        private readonly webSocketService: WebSocketService
    ) { }

    private _webServerHost: string = environment.webServerURL;
    private _socketServerHost: string = environment.webSocketURL;

    public getFilesInfo (login: string): Observable<IFileInfoWithComments[]> {
        return this.http.get(`${this._webServerHost}/getFilesInfo/:${login}`) as Observable<IFileInfoWithComments[]>;
    }

    public uploadFile (formFile: File, uploadFileForm: FormGroup, newClientId: number): void {
        const reader = new FileReader();

        reader.onload = event => {
            const fileData: ArrayBuffer = (event.target as FileReader).result as ArrayBuffer;

            const slicedFileData: ArrayBuffer[] = [];

            for (let i = 0; i <= fileData.byteLength; i += 100000) {
                slicedFileData.push(fileData.slice(i, i + 100000));
            } 

            this.webSocketService.on(this._socketServerHost, uploadFileForm, slicedFileData, newClientId);
        }

        reader.readAsArrayBuffer(formFile);
    }
}