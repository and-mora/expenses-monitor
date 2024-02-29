import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, catchError, first, firstValueFrom, map, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedIn = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedIn.asObservable();

  private baseUrl = 'http://localhost:8443/';
  private loginUrl = 'login';

  private checkUrl = 'greet';

  constructor(private http: HttpClient) {
    // add session storage check
    
  }

  login(username: string, password: string): Observable<boolean> {
    // compose urlencoded request body
    var formBody: string[] = [];
    formBody.push(encodeURIComponent('username') + "=" + encodeURIComponent(username));
    formBody.push(encodeURIComponent('password') + "=" + encodeURIComponent(password));
    const body = formBody.join("&");

    return this.http.post(this.baseUrl + this.loginUrl, body, {
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
  }

  logout(): void {
    // todo remove session cookie?
    this.isLoggedIn.next(false);
  }

  // isAuthenticated(): Promise<boolean> {
  //   if (!this.isLoggedIn.value) {
  //     // additional check on new page and refresh
  //     console.log("not authenticated... checking better");
  //     // api call to get account info ?
  //     // const login$ = this.http.get(this.baseUrl + this.checkUrl)
  //     //   .pipe(
  //     //     map(_ => {
  //     //       console.log("checking auth");
  //     //       this.isLoggedIn.next(true);
  //     //       return true;
  //     //     })
  //     //   );

  //     // return firstValueFrom(login$);
  //     return new Promise(() => false);
  //   }

  //   return new Promise(() => true);
  // }

  isAuthenticated(): boolean {
    // check for the presence of session storage
    return this.isLoggedIn.value;
  }

}
