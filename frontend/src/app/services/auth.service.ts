import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, throwError } from 'rxjs';
import { LoginDto } from '../model/login';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);

  private isLoggedIn = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedIn.asObservable();

  constructor() {
    // session cookie check on refresh or new page
    this.checkSessionAlive();
  }

  checkSessionAlive() {
    this.apiService.checkSessionAlive()
      .subscribe({
        next: () => {
          console.log("check OK!")
          this.isLoggedIn.next(true);
        },
        error: () => {
          this.isLoggedIn.next(false);
        }
      });
  }
}
