import { Component } from '@angular/core';

import { environment } from '../../environments/environment';

import { IFileInfoWithComments } from '../../@types/global';

@Component({
    selector: 'app-downloaded-files-list',
    templateUrl: './downloaded-files-list.component.html',
    styleUrls: ['./downloaded-files-list.component.css']
})
export class DownloadedFilesListComponent {
    constructor () { }

    public webServerHost: string = environment.webServerURL;

    public filesInfoWithComments: IFileInfoWithComments[];
}