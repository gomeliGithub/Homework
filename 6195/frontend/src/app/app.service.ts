import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { QueryResultComponent } from './query-result/query-result.component';

import { environment } from '../environments/environment';

import { IQueryResult } from '../@types/global';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    constructor (private readonly http: HttpClient) { }

    private _host: string = environment.apiURL;

    public getDBList (): Observable<string[]> {
        return this.http.get(`${this._host}/getDBList`) as Observable<string[]>;
    }

    public sendSQLQuery (sqlQuery: string, dbName: string): Observable<IQueryResult> {
        return this.http.post(`${this._host}/sendSQLQuery`, { sqlQuery, dbName }) as Observable<IQueryResult>;
    }

    public createQueryResultInstance (viewRef: ViewContainerRef, componentRef: ComponentRef<QueryResultComponent>, queryResultData: IQueryResult): void {
        viewRef.clear();

        const queryResultComponent: ComponentRef<QueryResultComponent> = viewRef.createComponent(QueryResultComponent);

        queryResultComponent.instance.queryResultStatus = queryResultData.queryResultStatus;
        queryResultComponent.instance.fieldsTitles = queryResultData.fieldsTitles ? queryResultComponent.instance.fieldsTitles?.concat(queryResultData.fieldsTitles) : undefined;
        queryResultComponent.instance.itemsValues = queryResultData.itemsValues;
        queryResultComponent.instance.rowsNumberAffected = queryResultData.rowsNumberAffected;

        componentRef = queryResultComponent;
    }
}