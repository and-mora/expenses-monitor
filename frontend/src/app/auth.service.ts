import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedIn: boolean = false;

  constructor() { }

  login(username: string, password: string): boolean {
    // Here you would implement actual authentication logic, for demo purposes let's assume it's successful

    // todo rest api to backend /api/login
    if (username === 'user' && password === 'password') {
      this.isLoggedIn = true;
      return true;
    } else {
      return false;
    }
  }

  logout(): void {
    this.isLoggedIn = false;
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
}
