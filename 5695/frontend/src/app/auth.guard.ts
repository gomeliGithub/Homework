import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor (
        private readonly http: HttpClient,
        private readonly router: Router
    ) { }

    private _webServerHost: string = environment.webServerURL;

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        return this.http.get(`${this._webServerHost}/checkSessionExists`, { responseType: 'text' }).pipe(map(sessionExists => {
            if (sessionExists === 'EXISTS') return true;
            else return false;
        }));
    }
}