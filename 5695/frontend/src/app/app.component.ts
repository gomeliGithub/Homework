import { AfterViewInit, Component, ComponentRef, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { AppService } from './app.service';

import { DownloadedFilesListComponent } from './downloaded-files-list/downloaded-files-list.component';
import { DownloadedFilesListComponentService } from './downloaded-files-list/downloaded-files-list-component.service';

import { environment } from '../environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
    constructor (
        private readonly http: HttpClient,
        private readonly appService: AppService,
        private readonly downloadedFilesListComponentService: DownloadedFilesListComponentService
    ) { }

    @ViewChild(DownloadedFilesListComponent) downloadedFilesListComponent: DownloadedFilesListComponent
    @ViewChild('appDownloadedFilesList', { read: ViewContainerRef, static: false })
    private downloadedFilesListViewRef: ViewContainerRef;
    private downloadedFilesListComponentRef: ComponentRef<DownloadedFilesListComponent>;

    private _webServerHost: string = environment.webServerURL;

    private _formFile: File;

    public responseMessage: string;

    public uploadFileForm: FormGroup = new FormGroup({   
        "formFile": new FormControl("", [ Validators.required, this.fileValidator ]),
        "formFileComment": new FormControl("", Validators.required)
    });

    ngAfterViewInit (): void {
        this.downloadedFilesListComponentService.getFilesInfo().subscribe(data => {
            this.appService.createDownloadedFilesListInstance(this.downloadedFilesListViewRef, this.downloadedFilesListComponentRef, {
                filesInfoWithComments: data
            });
        });
    }

    public fileValidator (control: FormControl): { [ s: string ]: boolean } | null {
        if (this._formFile.size > 104857600 || this._formFile.name.length < 4) {
            return { "formFile": true };
        }

        return null;
    }

    public fileChange (event: any): void {
        let fileList: FileList = event.target.files;

        if (fileList.length < 1) {
            return;
        }

        this._formFile = fileList[0];
    }

    public async uploadFile (): Promise<void> {
        const fileMetaJson: string = JSON.stringify({
            name         : this._formFile.name,
            size         : this._formFile.size,
            type         : this._formFile.type
        }); 

        const newClientId: number = Math.random();
        
        this.http.post(`${this._webServerHost}/uploadFile`, {
            _id: newClientId, 
            uploadFileMeta: fileMetaJson, 
            uploadFileComment: this.uploadFileForm.value['formFileComment'] as string
        }, { responseType: 'text' }).subscribe({
            next: result => {
                switch (result) {
                    case 'START': { this.appService.uploadFile(this._formFile, this.uploadFileForm, newClientId); break; }
                    case 'PENDING': { this.responseMessage = "Сервер занят. Повторите попытку позже."; break; }
                    case 'FILEEXISTS': { this.responseMessage = "Файл с таким именем уже загружен."; break; }
                    case 'MAXCOUNT': { this.responseMessage = "Загружено максимальное количество файлов."; break; }
                }
            },
            error: () => {
                this.responseMessage = "Что-то пошло не так. Попробуйте ещё раз.";
            }
        });
    }
}