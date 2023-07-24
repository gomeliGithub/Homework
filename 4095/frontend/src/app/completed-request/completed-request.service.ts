import { Injectable } from '@angular/core';
import { ISavedRequest } from '../@types/global';

@Injectable({
    providedIn: 'root'
})
export class CompletedRequestService {
    constructor () { }

    insertRequestDataToForm (savedRequests: ISavedRequest[], elementId: string): void {
        const requestMethodElement: HTMLSelectElement = document.getElementById('requestMethod') as HTMLSelectElement;
        const requestUrlElement: HTMLInputElement = document.getElementById('requestUrl') as HTMLInputElement;

        const savedRequestNumber: number = parseInt(elementId[elementId.length - 1], 10);

        const savedRequest: ISavedRequest = savedRequests[savedRequestNumber];

        requestMethodElement.value = savedRequest.method;
        requestUrlElement.value = savedRequest.url;
    }
}