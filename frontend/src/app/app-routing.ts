import { Route } from '@angular/router';
import { canActivateAuthRole } from './guards/auth.guard';

export const ROUTES: Route[] = [
  { path: '', canActivate: [canActivateAuthRole], loadComponent: () => import('./interfaces/homepage/homepage.component').then(mod => mod.HomepageComponent) },
  { path: 'login', loadComponent: () => import('./interfaces/login/login.component').then(mod => mod.LoginComponent) },
  { path: 'add-payment', canActivate: [canActivateAuthRole], loadComponent: () => import('./interfaces/add-payment/add-payment.component').then(mod => mod.AddPaymentComponent) },
  { path: 'add-wallet', canActivate: [canActivateAuthRole], loadComponent: () => import('./interfaces/add-wallet/add-wallet.component').then(mod => mod.AddWalletComponent) },
  { path: 'error', loadComponent: () => import('./interfaces/page-error/page-error.component').then(mod => mod.PageErrorComponent) },
];
