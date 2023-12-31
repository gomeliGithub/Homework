import { FormGroup } from "@angular/forms";

export interface IRequestParametersHeaders {
    name: string;
    value: string;
}

export interface ICompletedRequestCreateOptions {
    elementId: string;
    requestStatusCode: number;
    requestMethod: string;
    requestURL: string;
    requestHeaders: object[];
    requestParameters: object[];
    updatedSavedRequests: ISavedRequest[];
    headers: string[];
    createRequestForm: FormGroup<any>;
}

export interface ISavedRequest {
    elementId: string;
    statusCode: number;
    method: string;
    url: string;
    headers: object[];
    parameters: object[];
}