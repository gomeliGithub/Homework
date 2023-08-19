import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { environment } from '../environments/environment';

import { WebSocketService } from './web-socket/web-socket.service';

import { IWSMessage } from '../@types/global';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    constructor (private readonly webSocketService: WebSocketService) { }

    private _host: string = environment.webSocketURL;

    public formFile: File;

    public uploadFileForm: FormGroup = new FormGroup({   
        "formFile": new FormControl("", Validators.required),
        "formFileComment": new FormControl("", Validators.required)
    });

    ngOnInit (): void {
        this.webSocketService.on(this._host);
    }

    public fileChange (event: any): void {
        const fileList: FileList = event.target.files;

        if (fileList.length < 1) {
            return;
        }

        this.formFile = fileList[0];
    }

    public uploadFile (): void {
        /*const slicedFormFile: Blob[] = [];

        for (let i = 0; i <= this.formFile.size; i += 100000) {
            slicedFormFile.push(this.formFile.slice(i, i + 100000));
        }


        this.readFile(this.formFile);*/


        const reader = new FileReader();

        reader.onload = event => {
            const fileData: ArrayBuffer = (event.target as FileReader).result as ArrayBuffer;

            const slicedFileData: ArrayBuffer[] = [];

            for (let i = 0; i <= fileData.byteLength; i += 100000) {
                slicedFileData.push(fileData.slice(i, i + 100000));
            } 

            const fileMetaJson = JSON.stringify({
                lastModified : this.formFile.lastModified,
                name         : this.formFile.name,
                size         : this.formFile.size,
                type         : this.formFile.type,
                comment      : this.uploadFileForm.value['formFileComment']
            });

            this.webSocketService.sendFileTEST(slicedFileData, 0, fileMetaJson);
        }

        reader.readAsArrayBuffer(this.formFile);
    }

    public readFile (fileChunk: Blob) {
        const reader = new FileReader();

        reader.onload = event => {
            const fileData: string | ArrayBuffer = (event.target as FileReader).result as string | ArrayBuffer;

            const fileMetaJson = JSON.stringify({
                lastModified : this.formFile.lastModified,
                name         : this.formFile.name,
                size         : this.formFile.size,
                type         : this.formFile.type
            });

            this.webSocketService.sendFile(fileMetaJson, fileData as ArrayBuffer);
        }

        reader.readAsArrayBuffer(fileChunk);
    }
}