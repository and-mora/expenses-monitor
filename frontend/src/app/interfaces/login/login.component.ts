import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    this.authService.login(this.username, this.password).then(
      onSuccess => {
        this.router.navigate(['/']);
        console.log('Login successful');
      },
      onError => {
        // todo granular error management
        this.errorMessage = 'Invalid username or password';
      }
    );
  }
}
