import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { map } from 'rxjs';

import { environment } from '../../environments/environment';

import { ISignData, ISignResponseData } from '../../@types/global';

@Component({
    selector: 'app-sign',
    templateUrl: './sign.component.html',
    styleUrls: ['./sign.component.css']
})
export class SignComponent implements OnInit {
    constructor (
        private readonly http: HttpClient,
        private readonly router: Router,
        private readonly activateRoute: ActivatedRoute
    ) { }

    private _webServerHost: string = environment.webServerURL;

    @ViewChild('signError', { read: ViewContainerRef, static: false })
    private signErrorViewRef: ViewContainerRef;

    public signError: boolean = false;

    signForm: FormGroup = new FormGroup({
        "clientLogin": new FormControl("", Validators.required),
        "clientPassword": new FormControl("", Validators.required),
        "clientEmail": new FormControl("", [ Validators.required, Validators.email ])
    });

    public op: string = this.activateRoute.snapshot.params['op'];

    ngOnInit(): void { console.log(this.activateRoute.snapshot.params);
        
    }

    public sign (): void {
        const signData: ISignData = this.signForm.value;
        const signErrorElement: HTMLSpanElement = this.signErrorViewRef.element.nativeElement;

        this.http.post(`${this._webServerHost}/sign:${this.op}`, signData).pipe(map(data => data as ISignResponseData)).subscribe({
            next: data => {
                this.signError = false;

                this.op === 'in' ? this.router.navigate([ '/fileStorage', data.login ]) : this.router.navigate(['']);
            },
            error: () => {
                this.signError = true;

                signErrorElement.textContent = "Что-то пошло не так, попробуйте ещё раз.";
            }
        });
    }
}