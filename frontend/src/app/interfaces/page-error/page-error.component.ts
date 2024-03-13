import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-error',
  templateUrl: './page-error.component.html',
  styleUrl: './page-error.component.css',
  standalone: true,
  imports: [RouterLink, MatButton, MatCardModule]
})
export class PageErrorComponent {

}
