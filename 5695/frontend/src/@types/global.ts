export interface IWSMessage {
    event: string;
    data: any;
}

export interface IFileData {
    eventType: string;
    name: string;
    totalSize: number;
    chunkSize: number;
    chunkNumber: number;
}