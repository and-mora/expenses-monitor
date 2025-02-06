import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { LoginDto } from '../../model/login';
import { AuthService } from '../../services/auth.service';
import { DialogLoaderComponent } from '../dialog-loader/dialog-loader.component';
import { DialogSuccessComponent } from '../dialog-success/dialog-success.component';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
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
    private formBuilder: FormBuilder, private dialog: MatDialog) { }

  login(): void {
    // loader dialog
    const loaderDialog = this.dialog.open(DialogLoaderComponent, {
      disableClose: true,
      panelClass: 'transparent-dialog'
    });
    this.isButtonDisabled = true;

    // api call
    const loginData = this.loginForm.value as LoginDto;
    this.authService.login(loginData).subscribe({
      next: () => {
        this.router.navigate(['/']);
        console.log('Login successful');
        this.isButtonDisabled = false;
        loaderDialog.close();

        // open success dialog and close it after 1 seconds
        const successDialog = this.dialog.open(DialogSuccessComponent, {
          panelClass: 'transparent-dialog'
        });
        setTimeout(() => {
          successDialog.close();
        }, 500);
      },
      error: () => {
        // todo granular error management
        this.errorMessage = 'Invalid username or password';
        this.isButtonDisabled = false;
        loaderDialog.close();

        // open error dialog and close it after 1 seconds
        // const errorDialog = this.dialog.open(DialogErrorComponent, {
        //   panelClass: 'transparent-dialog'
        // });
        // setTimeout(() => {
        //   errorDialog.close();
        // }, 1000);
      }
    });
  }
}
