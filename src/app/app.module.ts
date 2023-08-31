import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthStateService } from './common/services/auth-state.service';
import { NotAuthorizedComponent } from './common/components/not-authorized/not-authorized.component';
import { NotFoundComponent } from './common/components/not-found/not-found.component';

@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent,
    NotAuthorizedComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule
  ],
  providers: [AuthStateService],
  bootstrap: [AppComponent]
})
export class AppModule { }
