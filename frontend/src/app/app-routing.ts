import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const ROUTES: Route[] = [
  { path: '', canActivate: [authGuard], loadComponent: () => import('./interfaces/homepage/homepage.component').then(mod => mod.HomepageComponent) },
  { path: 'login', loadComponent: () => import('./interfaces/login/login.component').then(mod => mod.LoginComponent) },
];