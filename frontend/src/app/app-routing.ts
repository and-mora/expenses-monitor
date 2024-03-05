import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const ROUTES: Route[] = [
  { path: '', canActivate: [authGuard], loadComponent: () => import('./interfaces/homepage/homepage.component').then(mod => mod.HomepageComponent) },
  { path: 'login', loadComponent: () => import('./interfaces/login/login.component').then(mod => mod.LoginComponent) },
  { path: 'add-payment', canActivate: [authGuard], loadComponent: () => import('./interfaces/add-payment/add-payment.component').then(mod => mod.AddPaymentComponent) },
];