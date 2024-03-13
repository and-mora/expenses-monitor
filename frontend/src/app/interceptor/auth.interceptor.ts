import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  req = req.clone({
    withCredentials: true
  })

  return next(req)
    .pipe(
      catchError((error: HttpErrorResponse) => {
        // intercept 401 and 403
        if ([HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden].includes(error.status)) {
          router.navigate(['/login']);
        }
        // intercept network error
        if (error.status == 0 && error.ok == false) {
          router.navigate(['/error']);
        }
        return throwError(() => error);
      })
    );
};
