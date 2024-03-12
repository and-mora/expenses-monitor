import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dialog-loader',
  templateUrl: './dialog-loader.component.html',
  styleUrl: './dialog-loader.component.css',
  standalone: true,
  imports: [MatProgressSpinnerModule]
})
export class DialogLoaderComponent {

}
