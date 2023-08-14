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
        "formFile": new FormControl("", Validators.required)
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

        this.webSocketService.sendFile(slicedFormFile, this.formFile.name, this.formFile.size, 0);*/



        const reader = new FileReader();

        reader.onload = event => {
            const fileData: string | ArrayBuffer = (event.target as FileReader).result as string | ArrayBuffer;

            const fileMetaJson = JSON.stringify({
                lastModified : this.formFile.lastModified,
                name         : this.formFile.name,
                size         : this.formFile.size,
                type         : this.formFile.type,
            });

            const enc  = new TextEncoder(); // always utf-8, Uint8Array()
            const buf1 = enc.encode('!');
            const buf2 = enc.encode(fileMetaJson);
            const buf3 = enc.encode("\r\n\r\n");
            const buf4 = fileData as ArrayBuffer;
        
            let sendData = new Uint8Array(buf1.byteLength + buf2.byteLength + buf3.byteLength + buf4.byteLength);

            sendData.set(new Uint8Array(buf1), 0);
            sendData.set(new Uint8Array(buf2), buf1.byteLength);
            sendData.set(new Uint8Array(buf3), buf1.byteLength + buf2.byteLength);
            sendData.set(new Uint8Array(buf4), buf1.byteLength + buf2.byteLength + buf3.byteLength);
        
            this.webSocketService.send(sendData);
        }

        reader.readAsArrayBuffer(this.formFile);
    }
}