import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { environment } from '../../environments/environment';

import { ISignData } from '../../@types/global';

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

    signForm: FormGroup = new FormGroup({
        "clientLogin": new FormControl("", Validators.required),
        "clientPassword": new FormControl("", Validators.required),
        "clientEmail": new FormControl("", [ Validators.required, Validators.email ])
    });

    public op: string = this.activateRoute.snapshot.params['op'];

    ngOnInit(): void {
        
    }

    public sign (): void {
        const signData: ISignData = this.signForm.value;
        const signErrorElement: HTMLSpanElement = this.signErrorViewRef.element.nativeElement;

        this.http.post(`${this._webServerHost}/sign:${this.op}`, signData).subscribe({
            next: () => this.op === 'in' ? this.router.navigate([ '/fileStorage' ]) : this.router.navigate(['']),
            error: () => signErrorElement.textContent = "Что-то пошло не так, попробуйте ещё раз."
        });
    }
}