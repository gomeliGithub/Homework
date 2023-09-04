import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppService } from './app.service';

import { DownloadedFilesListComponent } from './downloaded-files-list/downloaded-files-list.component';
import { SignComponent } from './sign/sign.component';

@NgModule({
    declarations: [
        AppComponent,
        DownloadedFilesListComponent,
        SignComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule
    ],
    providers: [AppService],
    bootstrap: [AppComponent]
})
export class AppModule { }