import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css',
  standalone: true
})
export class HomepageComponent {
  private authService = inject(AuthService);


  greet(): void {
    this.authService.checkSessionAlive();
  }
}
