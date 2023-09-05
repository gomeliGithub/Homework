export interface IWSMessage {
    event: string;
    text: string;
    percentUploaded: number;
}

export interface IFileInfoWithComments {
    name: string;
    comment: string;
}

export interface ISignData {
    login: string;
    password: string;
    email?: string;
}

export interface ISignResponseData {
    login?: string;
}