import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-completed-request',
    templateUrl: './completed-request.component.html',
    styleUrls: ['./completed-request.component.css']
})
export class CompletedRequestComponent implements OnInit {
    constructor () { }

    requestStatusCode: string
    requestMethod: string
    requestURL: string
    requestHeaders: object[]
    requestParameters: object[]

    ngOnInit (): void {
        
    }
}