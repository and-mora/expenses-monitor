import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css',
  standalone: true
})
export class HomepageComponent {

  constructor(private authService: AuthService) { }

  greet(): void {
    this.authService.checkSessionAlive();
  }
}
