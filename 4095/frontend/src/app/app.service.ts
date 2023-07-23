import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CompletedRequestComponent } from './completed-request/completed-request.component';

import { environment } from '../environments/environment';

import { ICompletedRequestCreateOptions, IRequestParametersHeaders } from './@types/global';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    private _host: string = environment.apiURL

    constructor (private http: HttpClient) { }

    sendRequest (method: string, url: string, headers: IRequestParametersHeaders[], parameters: IRequestParametersHeaders[]): Observable<Object> {
        return this.http.post(`${this._host}/sendRequest`, {
            requestMethod: method,
            requestUrl: url,
            requestHeaders: headers,
            requestParameters: parameters
        });
    }

    addControlInputs (headers: string[], formGroupType: 'headers' | 'parameters'): void { // ssdsd
        const formControlsContainer: HTMLDivElement = document.getElementById(`${formGroupType}Container`) as HTMLDivElement;

        if (formControlsContainer.children.length > 8) Array.from(formControlsContainer.children).forEach(item => item.remove());

        const formControlTypeContainer: HTMLDivElement = document.createElement('div');

        const formControlNameInput: HTMLInputElement | HTMLSelectElement = formGroupType !== 'headers' ? document.createElement('input') : this.createHeadersSelect(headers);

        const formControlContainer = document.createElement('div');
        const formControlValueInput: HTMLInputElement = document.createElement('input');
        const deleteButton: HTMLButtonElement = document.createElement('button');

        formControlTypeContainer.className = `d-flex flex-row ${formGroupType} mb-2`;

        if (formGroupType !== 'headers') {
            formControlNameInput.classList.add('form-control');
        }

        formControlNameInput.classList.add(`${formGroupType}Name`, 'w-25');
        formControlValueInput.className = `form-control ${formGroupType}Value`;

        deleteButton.className = "btn btn-danger ms-2";
        deleteButton.textContent = "Удалить";
        deleteButton.addEventListener('click', event => this.deleteControlInputs(event.target as EventTarget));

        formControlContainer.className = "d-flex flex-row ms-5 w-50";

        formControlContainer.append(formControlValueInput, deleteButton)

        formControlTypeContainer.append(formControlNameInput, formControlContainer);

        formControlsContainer.append(formControlTypeContainer);
    }

    deleteControlInputs (eventTarget?: EventTarget): void {
        if (eventTarget) {
            const container: HTMLDivElement = (eventTarget as HTMLButtonElement).parentElement?.parentElement as HTMLDivElement;

            container.remove();
        } else {
            const controlsContainer = document.querySelectorAll('#headersContainer .headers, #parametersContainer .parameters');

            Array.from(controlsContainer).forEach(controlsContainer => controlsContainer.remove());
        }

        const requestResponseContainer: HTMLDivElement = document.getElementById('requestResponse') as HTMLDivElement;

        Array.from(requestResponseContainer.children).forEach(item => item.remove());
    }

    createHeadersSelect (headers: string[]): HTMLSelectElement {
        const select: HTMLSelectElement = document.createElement('select');

        select.className = 'form-select';
        select.name = 'headers';

        select.setAttribute('formControlName', 'headers');

        headers.forEach(headerName => {
            const option: HTMLOptionElement = document.createElement('option');

            option.value = headerName;
            option.textContent = headerName;

            select.append(option);
        });

        return select;
    }

    getHeadersParametersData () {
        const headersDataInputs = Array.from(document.querySelectorAll('#headersContainer .headers'));
        const parametersDataInputs = Array.from(document.querySelectorAll('#parametersContainer .parameters'));

        const headers: IRequestParametersHeaders[] = headersDataInputs.map(headerDataInput => {
            const name: string = headerDataInput.children[0] ? headerDataInput.children[0]['value' as keyof Element] as string : "";
            const value: string = headerDataInput.children[1] ? headerDataInput.children[1]['value' as keyof Element] as string : "";

            return { name, value };
        });

        const parameters: IRequestParametersHeaders[] = parametersDataInputs.map(parameterDataInput => {
            const name: string = parameterDataInput.children[0] ? parameterDataInput.children[0]['value' as keyof Element] as string : "";
            const value: string = parameterDataInput.children[0] ? parameterDataInput.children[1]['value' as keyof Element] as string : "";

            return { name, value };
        });
        
        return { headers, parameters };
    }

    createSaveRequest (viewRef: ViewContainerRef, componentRef: ComponentRef<CompletedRequestComponent>, createOptions: ICompletedRequestCreateOptions) {
        componentRef = this.createCompletedRequestInstance(viewRef, createOptions);
    }

    createCompletedRequestInstance (viewRef: ViewContainerRef, createOptions: ICompletedRequestCreateOptions): ComponentRef<CompletedRequestComponent> {
        // viewRef.clear();

        const completedRequestComponent = viewRef.createComponent(CompletedRequestComponent);

        completedRequestComponent.instance.requestStatusCode = createOptions.requestStatusCode.toString();
        completedRequestComponent.instance.requestMethod = createOptions.requestMethod;
        completedRequestComponent.instance.requestURL = createOptions.requestURL;
        completedRequestComponent.instance.requestHeaders = createOptions.requestHeaders;
        completedRequestComponent.instance.requestParameters = createOptions.requestParameters;

        return completedRequestComponent;
    }

    saveRequest (requestMethod: string, requestUrl: string, statusCode: string): void {
        const completedRequestsContainer: HTMLDivElement = document.getElementById('completedRequestsContainer') as HTMLDivElement;
        
        const spanContainer: HTMLDivElement = document.createElement('div');
        const span: HTMLSpanElement = document.createElement('span');
        const span2: HTMLSpanElement = document.createElement('span');

        spanContainer.className = `badge text-bg-primary fs-6 ${statusCode.startsWith('4') || statusCode.startsWith('5') ? 'bg-danger' : ''} mb-2`;

        span.className = "d-block mb-1";
        span.textContent = `Метод: ${requestMethod}`;
        span2.textContent = requestUrl;

        spanContainer.append(span, span2);

        completedRequestsContainer.append(spanContainer);
    }
}