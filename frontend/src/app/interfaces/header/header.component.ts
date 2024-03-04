import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule]
})
export class HeaderComponent {
  public isLoggedIn$: Observable<boolean>;

  constructor(private router: Router, private authService: AuthService) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }

}
