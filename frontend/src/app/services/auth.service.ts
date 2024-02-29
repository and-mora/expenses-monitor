import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, firstValueFrom, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedIn = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedIn.asObservable();

  private baseUrl = 'http://localhost:8443/';
  private loginUrl = 'login';

  constructor(private http: HttpClient) { }

  async login(username: string, password: string): Promise<boolean> {
    // compose urlencoded request body
    var formBody: string[] = [];
    formBody.push(encodeURIComponent('username') + "=" + encodeURIComponent(username));
    formBody.push(encodeURIComponent('password') + "=" + encodeURIComponent(password));
    const body = formBody.join("&");

    const login$ = this.http.post(this.baseUrl + this.loginUrl, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .pipe(
        map(_ => {
          this.isLoggedIn.next(true);
          return true
        }),
        catchError(err => {
          this.isLoggedIn.next(false);
          return throwError(() => new Error(err));
        })
      );
    return firstValueFrom(login$);
  }

  logout(): void {
    // todo remove session cookie?
    this.isLoggedIn.next(false);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn.value;
  }
}
