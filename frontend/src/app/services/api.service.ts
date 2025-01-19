import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { PaymentDto } from '../model/payment';
import { WalletDto } from '../model/wallet';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = environment.apiUrl;
  private loginUrl = 'login';
  private logoutUrl = 'logout';
  private checkUrl = 'greet';
  private paymentUrl = 'api/payment';
  private categoryUrl = 'api/payment/categories';
  private walletUrl = 'api/wallets';

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

  addPayment(payment: PaymentDto): Observable<Object> {
    return this.http.post(this.baseUrl + this.paymentUrl, JSON.stringify(payment), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  getCategories(): Observable<string> {
    const eventSource = new EventSource(this.baseUrl + this.categoryUrl, { withCredentials: true });

    return new Observable(observer => {
      eventSource.onmessage = event => {
        const messageData: string = event.data;
        observer.next(messageData);
      };
      eventSource.onerror = () => {
        observer.complete();
        eventSource.close();
      }
    });
  }

  getWallets(): Observable<WalletDto[]> {
    return this.http.get<WalletDto[]>(this.baseUrl + this.walletUrl);
  }
}
