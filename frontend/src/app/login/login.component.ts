import { Component } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService) { }

  login(): void {
    if (this.authService.login(this.username, this.password)) {
      // Redirect to home page or dashboard upon successful login
      console.log('Login successful');
    } else {
      this.errorMessage = 'Invalid username or password';
    }
  }
}
