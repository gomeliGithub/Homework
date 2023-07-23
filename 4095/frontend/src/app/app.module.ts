import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AppService } from './app.service';

import { CompletedRequestComponent } from './completed-request/completed-request.component';

@NgModule({
    declarations: [
        AppComponent,
        CompletedRequestComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
    ],
    providers: [AppService],
    bootstrap: [AppComponent]
})
export class AppModule { }