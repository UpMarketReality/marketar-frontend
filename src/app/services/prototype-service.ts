import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PageDTO } from '../model/page-dto';
import { PrototypeDTO } from '../model/prototype-dto';
import { PrototypeRequest } from '../model/prototype-request';

@Injectable({
  providedIn: 'root',
})
export class PrototypeService {
  private readonly http = inject(HttpClient);
  // Debe ser una URL absoluta al backend para que el interceptor agregue el token JWT
  private readonly apiUrl = `${environment.apiUrl}/v1/prototypes`;

  generar(datos: PrototypeRequest): Observable<PrototypeDTO> {
    return this.http.post<PrototypeDTO>(this.apiUrl, datos);
  }

  // GET /api/v1/prototypes/me (prototipos del comprador autenticado)
  getMyPrototypes(categoryId?: number, page: number = 0, size: number = 20): Observable<PageDTO<PrototypeDTO>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (categoryId != null) params = params.set('categoryId', categoryId.toString());
    return this.http.get<PageDTO<PrototypeDTO>>(`${this.apiUrl}/me`, { params });
  }

  obtenerPorId(id: number): Observable<PrototypeDTO> {
    return this.http.get<PrototypeDTO>(`${this.apiUrl}/${id}`);
  }

  obtenerImagen(prototypeId: number, imageUrl: string): Observable<Blob> {
    // ImageDTO devuelve una URL, no un filename.
    // Se extrae el nombre del archivo para utilizar
    // el endpoint protegido del PrototypeController.

    const parsed = new URL(imageUrl, window.location.origin);

    const segmentos = parsed.pathname.split('/').filter(Boolean);

    const ultimo = segmentos[segmentos.length - 1];

    if (!ultimo) {
      throw new Error('La imagen no tiene un archivo válido.');
    }

    const filename = decodeURIComponent(ultimo);

    if (
      filename === '.' ||
      filename === '..' ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new Error('Nombre de imagen inválido.');
    }

    return this.http.get(`${this.apiUrl}/${prototypeId}/images/` + encodeURIComponent(filename), {
      responseType: 'blob',
    });
  }
}
