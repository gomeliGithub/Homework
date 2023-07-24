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
export class AppComponent implements OnInit {
    createRequestForm : FormGroup = new FormGroup({
        "method": new FormControl("", Validators.required),
        "url": new FormControl("", Validators.required)
    });

    requestSended: boolean = false
    requestCompleted: boolean = false

    completedRequestMethod: string = ""
    completedRequestUrl: string = ""

    completedResponseStatusCode: string = ""
    completedResponseHeaders: [string, any][] = [];
    completedResponseBody: string = ""

    methods = [ 'GET', 'POST' ]
    headers = [ 'Accept', 'Accept-Language', 'Content-Language', 'Content-Type' ]

    savedRequests: ISavedRequest[]

    constructor (private readonly appService: AppService) { }

    @ViewChild(CompletedRequestComponent) completedRequestComponent: CompletedRequestComponent
    @ViewChild('appСompletedRequests', { read: ViewContainerRef, static: false })
    private completedRequestViewRef: ViewContainerRef;
    private completedRequestComponentRef: ComponentRef<CompletedRequestComponent>;

    ngOnInit (): void {
        
    }

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
                requestParameters: parameters
            }, this.savedRequests);

            this.savedRequests = updatedSavedRequests;

            this.completedRequestMethod = method;
            this.completedRequestUrl = url;

            this.completedResponseStatusCode = data['statusCode' as keyof Object] as unknown as string;
            this.completedResponseHeaders = Object.entries(data['headers' as keyof Object]);
            this.completedResponseBody = JSON.stringify(data['body' as keyof Object]);

            this.requestCompleted = true;
        });
    }

    reset (): void {
        this.createRequestForm.reset();
        this.deleteControlInputs();
    }
}
