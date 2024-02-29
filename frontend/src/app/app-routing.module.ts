import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { HomepageComponent } from './interfaces/homepage/homepage.component';
import { LoginComponent } from './interfaces/login/login.component';

const routes: Routes = [
  { path: '', component: HomepageComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
