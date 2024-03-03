import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = environment.apiUrl;
  private loginUrl = 'login';
  private logoutUrl = 'logout';
  private checkUrl = 'greet';

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<Object> {
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

  logout(): Observable<Object> {
    return this.http.post(this.baseUrl + this.logoutUrl, null);
  }

  checkSessionAlive(): Observable<String> {
    return this.http.get(this.baseUrl + this.checkUrl,
      {
        responseType: 'text'
      }
    );
  }
}
