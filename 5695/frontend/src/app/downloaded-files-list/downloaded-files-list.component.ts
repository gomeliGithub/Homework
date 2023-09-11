import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { Observable, map } from 'rxjs';

import { DownloadedFilesListComponentService } from './downloaded-files-list-component.service';

import { environment } from '../../environments/environment';

import { IFileInfoWithComments } from '../../@types/global';

@Component({
    selector: 'app-downloaded-files-list',
    templateUrl: './downloaded-files-list.component.html',
    styleUrls: ['./downloaded-files-list.component.css']
})
export class DownloadedFilesListComponent implements OnInit {
    constructor (
        private readonly http: HttpClient,
        private readonly downloadedFilesListComponentService: DownloadedFilesListComponentService,
        private readonly activateRoute: ActivatedRoute,
        private readonly titleService: Title
    ) { }

    @ViewChild('noFilesUploaded', { static: false }) private noFilesUploadedViewRef: ElementRef<HTMLDivElement>;

    public login: string = this.activateRoute.snapshot.paramMap.get('login') as string;

    public filesInfo: Observable<IFileInfoWithComments[]> = this.downloadedFilesListComponentService.getFilesInfo(this.login).pipe(map(data => this.filesInfoWithComments = data));
    public filesInfoWithComments: IFileInfoWithComments[];

    public webServerHost: string = environment.webServerURL;

    private _formFile: File;

    public responseMessage: string;

    public uploadFileForm: FormGroup = new FormGroup({   
        "formFile": new FormControl("", [ Validators.required, this.fileValidator ]),
        "formFileComment": new FormControl("", Validators.required)
    });

    ngOnInit (): void {
        this.titleService.setTitle(this.login);
    }

    public fileValidator (_: FormControl): { [ s: string ]: boolean } | null {
        if (this && (this._formFile.size > 104857600 || this._formFile.name.length < 4)) {
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
        
        this.http.post(`${this.webServerHost}/uploadFile`, {
            _id: newClientId, 
            clientLogin: this.login,
            uploadFileMeta: fileMetaJson, 
            uploadFileComment: this.uploadFileForm.value['formFileComment'] as string
        }, { responseType: 'text', withCredentials: true }).subscribe({
            next: result => {
                switch (result) {
                    case 'START': { if (this.noFilesUploadedViewRef) this.noFilesUploadedViewRef.nativeElement.remove(); this.downloadedFilesListComponentService.uploadFile(this._formFile, this.uploadFileForm, newClientId); break; }
                    case 'PENDING': { this.responseMessage = "Сервер занят. Повторите попытку позже."; break; }
                    case 'FILEEXISTS': { this.responseMessage = "Файл с таким именем уже загружен."; break; }
                    case 'MAXCOUNT': { this.responseMessage = "Загружено максимальное количество файлов."; break; }
                    case 'MAXSIZE': { this.responseMessage = "Максимальный размер файла - 100 МБ."; break; }
                    case 'MAXNAMELENGTH': { this.responseMessage = "Имя файла должно содержать как минимум 4 символа."; break; }
                }
            },
            error: () => this.responseMessage = "Что-то пошло не так. Попробуйте ещё раз."
        });
    }
}