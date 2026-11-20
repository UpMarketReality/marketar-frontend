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

          if (!data || !data.jwt) {
            throw new Error('No se recibió un JWT válido');
          }

          localStorage.setItem('marketar_session', JSON.stringify(data));

          // Guardar la sesión en localStorage
          this.saveSession(data);

          return data;
        }),
      );
  }

  // GUARDAR SESIÓN
  private saveSession(response: ResponseDto): void {
    localStorage.setItem(TokenKey, JSON.stringify(response));
  }

  getSession(): ResponseDto | null {
    const saved = sessionStorage.getItem(TokenKey);

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

  // COMPROBAR AUTENTICACIÓN
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
    localStorage.removeItem('access_token');
  }
}
