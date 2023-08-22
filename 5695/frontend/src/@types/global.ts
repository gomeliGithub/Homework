import { Observable } from "rxjs";

export interface IWSMessage {
    event: string;
    text: string;
    percentUploaded: number;
}

export interface ICreateOptions {
    filesInfoWithComments: IFileInfoWithComments[]
}

export interface IFileInfoWithComments {
    name: string;
    comment: string;
}