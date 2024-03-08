import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { LoginDto } from '../model/login';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedIn = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedIn.asObservable();

  constructor(private http: HttpClient, private apiService: ApiService) {
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

  login(loginData: LoginDto): Observable<boolean> {
    return this.apiService.login(loginData.username, loginData.password)
      .pipe(
        map(_ => {
          this.isLoggedIn.next(true);
          return true;
        }),
        catchError(err => {
          this.isLoggedIn.next(false);
          return throwError(() => new Error(err));
        })
      );
  }

  logout(): Observable<boolean> {
    return this.apiService.logout()
      .pipe(
        map(_ => {
          this.isLoggedIn.next(false);
          return false;
        }),
        catchError(err => {
          return throwError(() => new Error(err));
        })
      );
  }

  isAuthenticated(): Observable<boolean> {
    if (!this.isLoggedIn.value) {
      // additional runtime check on new page and refresh (can be removed if cause problems!)
      console.log("not authenticated... checking better");

      return this.apiService.checkSessionAlive()
        .pipe(
          map(() => {
            console.log("checking auth");
            this.isLoggedIn.next(true);
            return true;
          })
        );
    }

    return of(true);
  }
}
