import { Component, ComponentRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AppService } from './app.service';

import { CompletedRequestComponent } from './completed-request/completed-request.component';

import { ISavedRequest } from './@types/global';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    createRequestForm : FormGroup = new FormGroup({
        "method": new FormControl("", Validators.required),
        "url": new FormControl("", Validators.required)
    });

    requestSended: boolean = false
    requestCompleted: boolean = false

    completedRequestMethod: string = ""
    completedRequestUrl: string = ""

    completedResponseStatusCode: string = ""
    completedResponseContentType: string = ""
    completedResponseHeaders: [string, any][] = [];
    completedResponseBody: string | typeof Blob = ""

    methods = [ 'GET', 'POST' ]
    headers = [ 'Accept', 'Accept-Language', 'Content-Language', 'Content-Type' ]

    savedRequests: ISavedRequest[] = []

    constructor (private readonly appService: AppService) { }

    @ViewChild(CompletedRequestComponent) completedRequestComponent: CompletedRequestComponent
    @ViewChild('appСompletedRequests', { read: ViewContainerRef, static: false })
    private completedRequestViewRef: ViewContainerRef;
    private completedRequestComponentRef: ComponentRef<CompletedRequestComponent>;

    addControlInputs (formGroupType: 'headers' | 'parameters'): void {
        return this.appService.addControlInputs(this.headers, formGroupType);
    }

    deleteControlInputs (eventTarget?: EventTarget): void {
        return this.appService.deleteControlInputs(eventTarget);
    }

    submit (): void {
        const { headers, parameters } = this.appService.getHeadersParametersData();

        const method: string = this.createRequestForm.value.method;
        const url: string = this.createRequestForm.value.url;

        this.requestSended = true;

        this.appService.sendRequest(method, url, headers, parameters).subscribe(data => {
            const updatedSavedRequests = this.appService.createSaveRequest(this.completedRequestViewRef, this.completedRequestComponentRef, {
                elementId: '',
                requestStatusCode: data['statusCode' as keyof Object] as unknown as number,
                requestMethod: method,
                requestURL: url,
                requestHeaders: headers,
                requestParameters: parameters,
                updatedSavedRequests: [],
                headers: this.headers,
                createRequestForm: this.createRequestForm
            }, this.savedRequests);

            this.savedRequests = updatedSavedRequests;

            this.completedResponseStatusCode = data['statusCode' as keyof Object] as unknown as string;
            this.completedResponseHeaders = Object.entries(data['headers' as keyof Object]);

            const contentTypeId: number = this.completedResponseHeaders.findIndex((headerArr => headerArr[0] === 'content-type')) as unknown as number;

            this.completedResponseContentType = this.completedResponseHeaders[contentTypeId][1][0];

            this.completedRequestMethod = method;
            this.completedRequestUrl = url;

            if (this.completedResponseContentType === 'application/json') this.completedResponseBody = JSON.stringify(data['body' as keyof Object]);
            if (this.completedResponseContentType === ('text/plain' || 'text/html' || 'application/xml')) this.completedResponseBody = data['body' as keyof Object] as unknown as string;
            if (this.completedResponseContentType === 'image/jpeg') this.completedResponseBody = data['body' as keyof Object] as unknown as typeof Blob;

            this.requestCompleted = true;
        });
    }

    reset (): void {
        return this.appService.reset(this.createRequestForm);
    }
}
