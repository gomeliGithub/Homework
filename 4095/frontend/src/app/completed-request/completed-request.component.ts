import { Component, Input, OnInit } from '@angular/core';

import { CompletedRequestService } from './completed-request.service';

import { ISavedRequest } from '../@types/global';

@Component({
    selector: 'app-completed-request',
    templateUrl: './completed-request.component.html',
    styleUrls: ['./completed-request.component.css']
})
export class CompletedRequestComponent implements OnInit {
    constructor (private completedRequestService: CompletedRequestService) { }

    elementId: string
    requestStatusCode: string
    requestMethod: string
    requestURL: string
    requestHeaders: object[]
    requestParameters: object[]

    savedRequests: ISavedRequest[]

    ngOnInit (): void {
        
    }

    insertRequestDataToForm (): void { debugger;
        return this.completedRequestService.insertRequestDataToForm(this.savedRequests, this.elementId);
    }
}