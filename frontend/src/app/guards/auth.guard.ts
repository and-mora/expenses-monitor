import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  if (inject(AuthService).isAuthenticated()) {
    console.log("Guard: ok");
    return true;
  }

  console.log("Guard: ko");
  // navigate to login page as user is not authenticated
  inject(Router).navigate(['/login']);
  return false;
};
