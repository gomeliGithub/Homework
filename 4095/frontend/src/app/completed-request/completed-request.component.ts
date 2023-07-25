import { Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { CompletedRequestService } from './completed-request.service';

import { ISavedRequest } from '../@types/global';

@Component({
    selector: 'app-completed-request',
    templateUrl: './completed-request.component.html',
    styleUrls: ['./completed-request.component.css']
})
export class CompletedRequestComponent {
    constructor (private completedRequestService: CompletedRequestService) { }

    elementId: string
    requestStatusCode: string
    requestMethod: string
    requestURL: string
    requestHeaders: object[]
    requestParameters: object[]

    savedRequests: ISavedRequest[]
    headers: string[]
    createRequestForm: FormGroup<any>

    @HostListener("click") onClick() {
        return this.completedRequestService.insertRequestDataToForm(this.savedRequests, this.headers, this.elementId, this.createRequestForm);
    }
}