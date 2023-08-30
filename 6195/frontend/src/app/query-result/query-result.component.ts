import { Component } from '@angular/core';

@Component({
    selector: 'app-query-result',
    templateUrl: './query-result.component.html',
    styleUrls: ['./query-result.component.css']
})
export class QueryResultComponent {
    constructor () { }

    fieldsTitles?: string[];
    fieldsValues?: string[][];
    rowsNumberAffected?: number;
}