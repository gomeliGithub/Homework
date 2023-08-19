import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { environment } from '../environments/environment';

import { WebSocketService } from './web-socket/web-socket.service';
import { AppService } from './app.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor (
        private readonly webSocketService: WebSocketService,
        private readonly http: HttpClient,
        private readonly appService: AppService
    ) { }

    private _webServerHost: string = environment.webServerURL;

    private _uploadStart: boolean;

    public formFile: File;

    public uploadFileForm: FormGroup = new FormGroup({   
        "formFile": new FormControl("", Validators.required),
        "formFileComment": new FormControl("", Validators.required)
    });

    public fileChange (event: any): void {
        let fileList: FileList = event.target.files;

        if (fileList.length < 1) {
            return;
        }

        this.formFile = fileList[0];
    }

    public async uploadFile (): Promise<void> {
        const fileMetaJson: string = JSON.stringify({
            name         : this.formFile.name,
            size         : this.formFile.size,
            type         : this.formFile.type,
            uploadDate   : Date.now()
        }); 
        
        this.http.post(`${this._webServerHost}/uploadFile`, { 
            _id: Math.random(), 
            uploadFileMeta: fileMetaJson, 
            uploadFileComment: this.uploadFileForm.value['formFileComment'] as string
        }, { responseType: 'text' }).subscribe(result => {
            if (result === 'START') {
                this.appService.uploadFile(this.formFile, this.uploadFileForm);
            }
        });
    }
}