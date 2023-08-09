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
        for (let i = 0; i <= this.formFile.size; i += 100000) {
            const sliceFilePart = this.formFile.slice(i, 100000);
        }



        
        const reader = new FileReader();

        let rawData: string | ArrayBuffer;

        /*reader.onloadend = () => {
            
        }

        reader.onload = event => {
            const eventTargetResult: string | ArrayBuffer = (event.target as FileReader).result as string | ArrayBuffer;

            rawData = eventTargetResult;

            this.webSocketService.send(rawData);

            console.log("The file has been transferred.");
        }*/

        reader.onload = event => {
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

        reader.readAsArrayBuffer(sliceFilePart);
    }
}
