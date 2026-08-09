import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  signup(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/signup`, { username, password });
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        map((response: any) => {
          // 🔥 DEBUG: Log the full response
          console.log('🔥 Full login response:', JSON.stringify(response, null, 2));

          // ✅ Extract token correctly
          const token = response?.data?.access_token || response?.access_token;

          if (token && typeof token === 'string') {
            // ✅ Clean the token - remove any whitespace, newlines
            const cleanToken = token.trim();
            console.log('✅ Clean token (length: ' + cleanToken.length + '):', cleanToken);

            // ✅ Validate JWT format (must have 3 parts separated by dots)
            const parts = cleanToken.split('.');
            if (parts.length === 3) {
              localStorage.setItem('access_token', cleanToken);
              console.log('✅ Token saved successfully!');
            } else {
              console.error('❌ Invalid JWT format! Token has ' + parts.length + ' parts, expected 3.');
              console.error('❌ Token:', cleanToken);
            }
          } else {
            console.error('❌ No valid token found in response:', response);
          }

          return response;
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}