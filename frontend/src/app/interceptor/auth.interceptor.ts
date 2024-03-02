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
        if ([HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden].includes(error.status)) {
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
};
