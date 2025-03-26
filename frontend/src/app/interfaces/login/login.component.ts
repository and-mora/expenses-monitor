import { Component, OnInit, effect, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType, ReadyArgs, typeEventArgs } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { interval, take } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [ReactiveFormsModule, MatProgressBarModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCardModule, MatProgressSpinnerModule]
})
export class LoginComponent implements OnInit {
  private readonly keycloak = inject(Keycloak);
  private readonly keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);
  private readonly router = inject(Router);

  authenticated = false;
  keycloakStatus: string | undefined;

  errorMessage: string = '';

  progressbarValue = 0;

  startTimer(seconds: number) {
    const time = seconds;
    const timer$ = interval(1000);

    const sub = timer$.pipe(take(seconds)).subscribe((sec) => {
      this.progressbarValue = (sec + 1) * 100 / seconds;

      if (this.progressbarValue === 100) {
        sub.unsubscribe();
        this.router.navigate(['/']);
      }
    });
  }

  constructor() {
    effect(() => {
      const keycloakEvent = this.keycloakSignal();

      this.keycloakStatus = keycloakEvent.type;

      if (keycloakEvent.type === KeycloakEventType.Ready) {
        this.authenticated = typeEventArgs<ReadyArgs>(keycloakEvent.args);
      }

      if (keycloakEvent.type === KeycloakEventType.AuthLogout) {
        this.authenticated = false;
      }
      console.log("authenticated?", this.authenticated);
    });
  }

  ngOnInit(): void {
    console.log("timer started");
    this.startTimer(3);
  }


  loginWithKeycloak() {
    this.keycloak.login();
  }
}
