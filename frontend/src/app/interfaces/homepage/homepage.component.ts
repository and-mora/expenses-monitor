import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth.service';
import { PaymentDto } from '../../model/payment';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule]
})
export class HomepageComponent {
  latestTransactions: PaymentDto[] = [];

  constructor(private authService: AuthService, private apiService: ApiService) { }

  greet(): void {
    this.authService.checkSessionAlive();
  }
}
