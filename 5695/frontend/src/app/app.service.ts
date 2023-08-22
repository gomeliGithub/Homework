import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { WebSocketService } from './web-socket/web-socket.service';

import { DownloadedFilesListComponent } from './downloaded-files-list/downloaded-files-list.component';

import { environment } from '../environments/environment';

import { ICreateOptions } from '../@types/global';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    constructor (private readonly webSocketService: WebSocketService) { }

    private _socketServerHost: string = environment.webSocketURL;

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

    public createDownloadedFilesListInstance (viewRef: ViewContainerRef, componentRef: ComponentRef<DownloadedFilesListComponent>, createOptions: ICreateOptions): void {
        viewRef.clear();

        const downloadedFilesListComponent = viewRef.createComponent(DownloadedFilesListComponent);

        downloadedFilesListComponent.instance.filesInfoWithComments = createOptions.filesInfoWithComments;

        componentRef = downloadedFilesListComponent;
    }
}