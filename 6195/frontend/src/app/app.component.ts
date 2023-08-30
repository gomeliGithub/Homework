import { Component, ComponentRef, ViewChild, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AppService } from './app.service';

import { QueryResultComponent } from './query-result/query-result.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor (private readonly appService: AppService) { }

    @ViewChild(QueryResultComponent) selectQueryResultComponent: QueryResultComponent
    @ViewChild('appQueryResult', { read: ViewContainerRef, static: false })
    private queryResultViewRef: ViewContainerRef;
    private queryResultComponentRef: ComponentRef<QueryResultComponent>;

    public sqlQueryForm: FormGroup = new FormGroup({   
        "sqlQueryFormQuery": new FormControl("", Validators.required),
        "sqlQueryFormDBName": new FormControl("", Validators.required)
    });

    public dbList: string[];

    public getDBList (): Subscription {
        return this.appService.getDBList().subscribe(data => this.dbList = data);
    }

    public sendSQLQuery () {
        const sqlQuery: string = this.sqlQueryForm.value['sqlQueryFormQuery'];
        const dbName: string = this.sqlQueryForm.value['sqlQueryFormDBName'];

        return this.appService.sendSQLQuery(sqlQuery, dbName).subscribe(data => this.appService.createQueryResultInstance(this.queryResultViewRef, this.queryResultComponentRef, data));
    }
}