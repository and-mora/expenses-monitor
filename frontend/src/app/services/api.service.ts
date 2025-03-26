import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EventSource } from 'eventsource';
import Keycloak from 'keycloak-js';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ErrorDto } from '../model/errorDto';
import { PaymentDto } from '../model/payment';
import { WalletDto } from '../model/wallet';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private keycloak = inject(Keycloak);

  private baseUrl = environment.apiUrl;
  private checkUrl = '/greet';
  private paymentUrl = '/api/payment';
  private categoryUrl = '/api/payment/categories';
  private walletUrl = '/api/wallets';

  // login(username: string, password: string): Observable<Object> {
  //   // compose urlencoded request body
  //   var formBody: string[] = [];
  //   formBody.push(encodeURIComponent('username') + "=" + encodeURIComponent(username));
  //   formBody.push(encodeURIComponent('password') + "=" + encodeURIComponent(password));
  //   const body = formBody.join("&");

  //   return this.http.post(this.baseUrl + this.loginUrl, body, {
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded'
  //     }
  //   });
  // }

  // logout(): Observable<Object> {
  //   return this.http.post(this.baseUrl + this.logoutUrl, null);
  // }

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

  getCategoriesStream(): Observable<string> {
    const eventSource = new EventSource(this.baseUrl + this.categoryUrl, {
      fetch: (input, init) => fetch(input, {
        ...init,
        headers: { ...(init?.headers || {}), Authorization: `Bearer ${this.keycloak.token}` },
      }),
    })

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

  getCategories(): Observable<string> {
    return this.http.get(this.baseUrl + this.categoryUrl, {
      responseType: 'text' // Specify that the response is plain text
    });
  }

  getWallets(): Observable<WalletDto[]> {
    return this.http.get<WalletDto[]>(this.baseUrl + this.walletUrl);
  }

  addWallet(wallet: WalletDto): Observable<WalletDto | ErrorDto> {
    return this.http.post<WalletDto>(this.baseUrl + this.walletUrl, JSON.stringify(wallet), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .pipe(
        catchError(err => this.convertToErrorDto(err))
      );
  }

  deleteWallet(walletId: string): Observable<void | ErrorDto> {
    return this.http.delete<void>(`${this.baseUrl + this.walletUrl}/${walletId}`)
      .pipe(
        catchError(err => this.convertToErrorDto(err))
      );
  }

  private convertToErrorDto(error: HttpErrorResponse): Observable<ErrorDto> {
    const errorDto: ErrorDto = {
      code: error.error.code,
      detail: error.error.detail,
    };
    return throwError(() => errorDto);
  }
}
