import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { PerfilUsuario } from '../model/perfilUsuario';
import { ActualizarPerfilRequest } from '../model/actualizar-perfil-request';
import { CambiarPasswordRequest } from '../model/cambiar-password-request';
import { environment } from '../../environments/environment';
import { DireccionCompradorResponse } from '../model/DireccionCompradorResponse';
import { DireccionCompradorRequest } from '../model/DireccionCompradorRequest';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl + '/usuario';

  private readonly perfilState = signal<PerfilUsuario | null>(null);

  readonly perfilActual = this.perfilState.asReadonly();

  limpiarPerfil(): void {
    this.perfilState.set(null);
  }

  obtenerMiPerfil(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.apiUrl}/me`).pipe(
      tap((usuario) => {
        this.perfilState.set(usuario);
      }),
    );
  }

  actualizarPerfil(datos: ActualizarPerfilRequest): Observable<PerfilUsuario> {
    return this.http.put<PerfilUsuario>(`${this.apiUrl}/me`, datos).pipe(
      tap((usuario) => {
        this.perfilState.set(usuario);
      }),
    );
  }

  // Obtener usuario por ID
  obtenerPorId(id: number): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.apiUrl}/${id}`);
  }

  // Cambiar contraseña
  cambiarPassword(datos: CambiarPasswordRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/me/password`, datos);
  }

  // Obtener dirección del comprador autenticado
  obtenerMiDireccion(): Observable<DireccionCompradorResponse> {
    return this.http.get<DireccionCompradorResponse>(`${this.apiUrl}/me/direccion`);
  }

  // Guardar o actualizar dirección
  actualizarMiDireccion(datos: DireccionCompradorRequest): Observable<DireccionCompradorResponse> {
    return this.http.put<DireccionCompradorResponse>(`${this.apiUrl}/me/direccion`, datos);
  }
}
