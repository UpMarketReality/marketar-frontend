import { Service } from '@angular/core';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface UserDTO {
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  jwt: string;
  roles: string[];
  expiresAt: string;
  user: UserDTO;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  readonly apiUrl = 'http://localhost:8080/api/v1';

  private storageKey = 'marketar_session';

  login(correo: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { correo, password }).pipe(
      tap((response) => {
        sessionStorage.setItem(this.storageKey, JSON.stringify(response));
      }),
    );
  }
  getSession(): LoginResponse | null {
    const saved = sessionStorage.getItem(this.storageKey);

    if (!saved) return null;

    try {
      const session = JSON.parse(saved) as LoginResponse;

      // Verificar que tenga JWT y no haya expirado.
      if (!session.jwt || !session.expiresAt || !(Date.parse(session.expiresAt) > Date.now())) {
        this.logout();
        return null;
      }

      return session;
    } catch {
      this.logout();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  getToken(): string | null {
    return this.getSession()?.jwt ?? null;
  }

  getUser(): UserDTO | null {
    return this.getSession()?.user ?? null;
  }

  hasRole(role: string): boolean {
    return this.getSession()?.roles.includes(`ROLE_${role}`) ?? false;
  }

  logout(): void {
    sessionStorage.removeItem(this.storageKey);
  }
}
