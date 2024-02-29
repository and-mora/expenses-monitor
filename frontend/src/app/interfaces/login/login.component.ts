import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  login(): void {
    if (this.authService.login(this.username, this.password)) {
      // Redirect to home page or dashboard upon successful login
      this.router.navigate(['/']);
      console.log('Login successful');
    } else {
      this.errorMessage = 'Invalid username or password';
    }
  }
}
