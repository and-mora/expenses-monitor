import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:8443/';
  private loginUrl = 'login';
  private logoutUrl = 'logout';

  private checkUrl = 'greet';

  constructor(private http: HttpClient) { }

  login(username: string, password: string) {
    // compose urlencoded request body
    var formBody: string[] = [];
    formBody.push(encodeURIComponent('username') + "=" + encodeURIComponent(username));
    formBody.push(encodeURIComponent('password') + "=" + encodeURIComponent(password));
    const body = formBody.join("&");

    return this.http.post(this.baseUrl + this.loginUrl, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  logout() {
    return this.http.post(this.baseUrl + this.logoutUrl, null);
  }

  checkSessionAlive() {
    return this.http.get(this.baseUrl + this.checkUrl,
      {
        responseType: 'text'
      }
    );
  }
}
