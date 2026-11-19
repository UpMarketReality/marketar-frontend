import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PerfilUsuario } from '../model/perfilUsuario';
import { ActualizarPerfilRequest } from '../model/actualizar-perfil-request';
import { CambiarPasswordRequest } from '../model/cambiar-password-request';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl + '/usuario';

  // Obtener datos del usuario autenticado
  obtenerMiPerfil(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.apiUrl}/me`);
  }

  // Obtener usuario por ID
  obtenerPorId(id: number): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.apiUrl}/${id}`);
  }

  // Actualizar datos personales
  actualizarPerfil(datos: ActualizarPerfilRequest): Observable<PerfilUsuario> {
    return this.http.put<PerfilUsuario>(`${this.apiUrl}/me`, datos);
  }

  // Cambiar contraseña
  cambiarPassword(datos: CambiarPasswordRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/me/password`, datos);
  }
}
