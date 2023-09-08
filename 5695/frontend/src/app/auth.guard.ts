import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, map } from 'rxjs';

import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor (
        private readonly http: HttpClient,
        private readonly router: Router,
        private readonly activateRoute: ActivatedRoute
    ) { }

    private _webServerHost: string = environment.webServerURL;

    canActivate (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.http.get(`${this._webServerHost}/checkSessionExists`, { responseType: 'text', withCredentials: true }).pipe(map(data => {
            if (data !== 'NONEXISTS') {
                this.router.createUrlTree([ '/fileStorage', !route.params['login'] ? data : route.params['login'] ], { relativeTo: this.activateRoute });

                return true;
            } else {
                this.router.navigate(['']);

                return false;
            }
        }));
    }
}