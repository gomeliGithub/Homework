import { NgModule } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterModule, RouterStateSnapshot, Routes } from '@angular/router';

import { DownloadedFilesListComponent } from './downloaded-files-list/downloaded-files-list.component';
import { SignComponent } from './sign/sign.component';

const appRoutes: Routes = [
    { path: 'sign/:op', component: SignComponent },
    { path: '', redirectTo: '/sign/in', pathMatch: 'full' },
    // { path: 'signIn', redirectTo: '/sign/in', pathMatch: 'full' },
    // { path: 'signUp', redirectTo: '/sign/up', pathMatch: 'full' },
    { path: 'fileStorage', component: DownloadedFilesListComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }