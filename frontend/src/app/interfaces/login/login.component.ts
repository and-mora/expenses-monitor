import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { LoginDto } from '../../model/login';
import { AuthService } from '../../services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatCardModule, MatProgressSpinnerModule]
})
export class LoginComponent {
  loginForm = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  })
  errorMessage: string = '';
  isButtonDisabled = false;

  constructor(private authService: AuthService, private router: Router,
    private formBuilder: FormBuilder) { }

  login(): void {
    this.isButtonDisabled = true;
    const loginData = this.loginForm.value as LoginDto;
    this.authService.login(loginData).subscribe({
      next: onSuccess => {
        this.router.navigate(['/']);
        console.log('Login successful');
        this.isButtonDisabled = false;
      },
      error: onError => {
        // todo granular error management
        this.errorMessage = 'Invalid username or password';
        this.isButtonDisabled = false;
      }
    });
  }
}
