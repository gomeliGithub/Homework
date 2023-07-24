import { Component, OnInit } from '@angular/core';

import { CompletedRequestService } from './completed-request.service';

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

    ngOnInit (): void {
        
    }

    insertRequestDataToForm (): void {
        return this.completedRequestService.insertRequestDataToForm();
    }
}