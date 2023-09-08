import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DownloadedFilesListComponent } from './downloaded-files-list/downloaded-files-list.component';
import { SignComponent } from './sign/sign.component';

import { AuthGuard } from './auth.guard';

const appRoutes: Routes = [
    { path: 'sign/:op', component: SignComponent },
    { path: '', redirectTo: '/sign/in', pathMatch: 'full' },
    { path: 'signIn', redirectTo: '/sign/in', pathMatch: 'full' },
    { path: 'signUp', redirectTo: '/sign/up', pathMatch: 'full' },
    { path: 'fileStorage/:login', component: DownloadedFilesListComponent, canActivate: [AuthGuard] },
    { path: 'fileStorage', component: DownloadedFilesListComponent, canActivate: [AuthGuard] }
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }