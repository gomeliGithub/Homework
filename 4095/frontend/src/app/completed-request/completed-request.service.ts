import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AppService } from '../app.service';

import { ISavedRequest } from '../@types/global';

@Injectable({
    providedIn: 'root'
})
export class CompletedRequestService {
    constructor (private appService: AppService) { }

    insertRequestDataToForm (savedRequests: ISavedRequest[], headersList: string[], elementId: string, createRequestForm: FormGroup<any>): void {
        const requestMethodElement: HTMLSelectElement = document.getElementById('requestMethod') as HTMLSelectElement;
        const requestUrlElement: HTMLInputElement = document.getElementById('requestUrl') as HTMLInputElement;

        const savedRequestNumber: number = parseInt(elementId[elementId.length - 1], 10);

        const savedRequest: ISavedRequest = savedRequests[savedRequestNumber];

        const serializeHeaders = this.serializeData(savedRequest.headers);
        const serializeParameters = this.serializeData(savedRequest.parameters);

        this.appService.reset(createRequestForm);

        requestMethodElement.value = savedRequest.method;
        requestUrlElement.value = savedRequest.url;
        
        if (serializeHeaders && serializeParameters) {
            Object.keys(serializeHeaders).forEach(value => this.appService.addControlInputs(headersList, 'headers', value, serializeHeaders[value as keyof {}]));
            Object.keys(serializeParameters).forEach(value => this.appService.addControlInputs([], 'parameters', value, serializeParameters[value as keyof {}]));
        }
    }

    serializeData (data: object[]) {
        const serializeDataObj = {};
    
        try {
            data.forEach(dataValueObj => {
                const dataValueArr = Object.values(dataValueObj);

                const dataKey: string = dataValueArr[0];
                const dataValue: string = dataValueArr[1];
    
                serializeDataObj[dataKey as keyof {}] = dataValue as keyof {};
            });
    
            return serializeDataObj;
        } catch {
            return null;
        }
    }
}