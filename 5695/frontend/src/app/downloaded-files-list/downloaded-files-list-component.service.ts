import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import { IFileInfoWithComments } from '../../@types/global';

@Injectable({
    providedIn: 'root'
})
export class DownloadedFilesListComponentService {
    constructor (private readonly http: HttpClient) { }

    private _webServerHost: string = environment.webServerURL;

    public getFilesInfo (): Observable<IFileInfoWithComments[]> {
        return this.http.get(`${this._webServerHost}/getFilesInfo`) as Observable<IFileInfoWithComments[]>;
    }
}