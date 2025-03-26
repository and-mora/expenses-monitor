import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthGuardData, createAuthGuard } from 'keycloak-angular';

const isAccessAllowed = async (
  route: ActivatedRouteSnapshot,
  _: RouterStateSnapshot,
  authData: AuthGuardData
): Promise<boolean | UrlTree> => {
  const { authenticated, grantedRoles } = authData;

  if (authenticated) {
    return true;
  }

  const router = inject(Router);
  return router.parseUrl('/login');
};

export const canActivateAuthRole = createAuthGuard<CanActivateFn>(isAccessAllowed);
