import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './interfaces/header/header.component';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    imports: [HeaderComponent, RouterOutlet, RouterLink, MatSidenavModule, MatListModule,
        MatToolbarModule, MatButtonModule, MatIconModule]
})
export class AppComponent {
  title = 'frontend';
}
