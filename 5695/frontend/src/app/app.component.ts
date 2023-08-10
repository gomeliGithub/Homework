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
        const slicedFormFile: Blob[] = [];

        for (let i = 0; i <= this.formFile.size; i += 100000) {
            slicedFormFile.push(this.formFile.slice(i, i + 100000));
        }

        // this.webSocketService.sendFile(slicedFormFile, this.formFile.name, this.formFile.size, 0);



        
        const reader = new FileReader();

        reader.onload = event => {
            const eventTargetResult: ArrayBuffer = (event.target as FileReader).result as ArrayBuffer;

            const int8Array = new Int8Array(eventTargetResult);

            this.webSocketService.send(int8Array);
        }

        reader.readAsArrayBuffer(this.formFile);

        /*reader.onloadend = () => {
            
        }

        reader.onload = event => {
            const eventTargetResult: string | ArrayBuffer = (event.target as FileReader).result as string | ArrayBuffer;

            rawData = eventTargetResult;

            this.webSocketService.send(rawData);

            console.log("The file has been transferred.");
        }*/

        /*reader.onload = event => { event.target?.result
            const int8Array = new Int8Array(fileReader.result);

            const data = [];

            int8Array.forEach((item) => {
                 data.push(item);
            });

            const payload = {
                name: file.name,
                type: file.type,
                size: file.size,
                data
            };

            this.webSocketService.send(JSON.stringify(payload));
        }

        reader.readAsArrayBuffer(sliceFilePart);*/
    }
}
