import { Injectable, inject } from '@angular/core';
import { map, Observable} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RequestDTO } from '../../model/request-dto';
import { ResponseDto } from '../../model/response-dto';
import { UsuarioDto } from '../../model/usuario-dto';
import { environment } from '../../../environments/environment';

const TokenKey = 'access_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  readonly apiUrl = environment.apiUrl + '/v1';

  private storageKey = 'marketar_session';

  login(request: RequestDTO): Observable<ResponseDto> {
    return this.http
      .post<ResponseDto>(`${this.apiUrl}/auth/login`, request, { observe: 'response' })
      .pipe(
        map((response) => {
          const data = response.body;

          // Comprobamos que el backend devuelva el JWT
          if (!data || !data.jwt) {
            throw new Error('El backend no devolvió un JWT');
          }

          // Guardamos toda la respuesta del usuario
          sessionStorage.setItem(this.storageKey, JSON.stringify(data));

          return data;
        }),
      );
  }
  getSession(): ResponseDto | null {
    const saved = sessionStorage.getItem(this.storageKey);

    if (!saved) return null;

    try {
      const session = JSON.parse(saved) as ResponseDto;

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

  getUser(): UsuarioDto | null {
    return this.getSession()?.user ?? null;
  }

  hasRole(role: string): boolean {
    return this.getSession()?.roles.includes(`ROLE_${role}`) ?? false;
  }

  logout(): void {
    sessionStorage.removeItem(this.storageKey);
    localStorage.removeItem('access_token');
  }
}
