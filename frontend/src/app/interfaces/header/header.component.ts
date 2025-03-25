import { Component, Input, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType, ReadyArgs, typeEventArgs } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  imports: [RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule]
})
export class HeaderComponent {
  authenticated = false;
  keycloakStatus: string | undefined;

  private router = inject(Router);
  private readonly keycloak = inject(Keycloak);
  private authService = inject(AuthService);
  private readonly keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);

  @Input() inputSideNav!: MatSidenav;

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

  logout() {
    this.keycloak.logout();
  }

}
