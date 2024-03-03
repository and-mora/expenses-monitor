import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { authInterceptor } from './interceptor/auth.interceptor';
import { HeaderComponent } from './interfaces/header/header.component';
import { HomepageComponent } from './interfaces/homepage/homepage.component';
import { LoginComponent } from './interfaces/login/login.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HeaderComponent,
    HomepageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule
  ],
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }