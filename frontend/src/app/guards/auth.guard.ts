import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  console.log("Guard kicked in!");
  if (inject(AuthService).isAuthenticated()) {
    return true;
  }

  // navigate to login page as user is not authenticated      
  inject(Router).navigate(['/login']);
  return false;
};
