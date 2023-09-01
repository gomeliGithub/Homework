export interface IQueryResult {
    queryResultStatus: string;
    fieldsTitles?: string[];
    itemsValues?: string[][];
    rowsNumberAffected?: number;
}