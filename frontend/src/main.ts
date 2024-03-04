import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { ROUTES } from './app/app-routing';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/interceptor/auth.interceptor';


bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, FormsModule),
        provideAnimationsAsync(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter(ROUTES, withPreloading(PreloadAllModules))
    ]
})
    .catch(err => console.error(err));
