import { ChangeDetectorRef, Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';
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
export class SignComponent {
    constructor (
        private readonly http: HttpClient,
        private readonly router: Router,
        private readonly activateRoute: ActivatedRoute,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) { }

    private _webServerHost: string = environment.webServerURL;

    @ViewChild('signError', { static: false }) private signErrorViewRef: ElementRef;
    
    public signError: boolean = false;

    public op: string = this.activateRoute.snapshot.paramMap.get('op') as string;

    signForm: FormGroup = new FormGroup({
        "clientLogin": new FormControl("", Validators.required),
        "clientPassword": new FormControl("", Validators.required),
        "clientEmail": new FormControl("", [ Validators.email ])
    });

    public sign (): void {
        const signData: ISignData = this.signForm.value;

        this.http.post(`${this._webServerHost}/sign/:${this.op}`, signData, { withCredentials: true }).pipe(map(data => data as ISignResponseData)).subscribe({
            next: data => {
                this.signError = false;

                if (this.op === 'in') this.router.navigate([ '/fileStorage', data.login ]).then(() => window.location.reload());
                else this.router.navigate(['']).then(() => window.location.reload());
            },
            error: () => {
                this.signError = true;

                this.changeDetectorRef.detectChanges();

                const signErrorElement: HTMLSpanElement = this.signErrorViewRef.nativeElement;

                signErrorElement.textContent = this.op === 'in' ? "Такого пользователя не существует, либо неверный пароль, либо данный пользователь не подтверждён." : 'Такой пользователь уже существует.';
            }
        });
    }

    public reloadComponent (): void {
        this.router.navigate(['/signUp']).then(() => window.location.reload());
    }
}