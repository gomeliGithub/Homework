export interface IRequestParametersHeaders {
    name: string;
    value: string;
}

export interface ICompletedRequestCreateOptions {
    requestStatusCode: number;
    requestMethod: string;
    requestURL: string;
    requestHeaders: object[];
    requestParameters: object[];
}