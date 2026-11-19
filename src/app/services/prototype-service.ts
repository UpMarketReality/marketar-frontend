import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { MOCK_PROTOTYPES, mockPage } from '../data/mock-data';
import { PageDTO } from '../model/page-dto';
import { PrototypeDTO } from '../model/prototype-dto';

@Injectable({
  providedIn: 'root',
})
export class PrototypeService {
  private apiUrl = `${environment.apiUrl}/prototypes`;

  constructor(private http: HttpClient) {}

  // US02 (Andre realizado por David K.)
  // 1. GET /api/v1/prototypes/me
  getMyPrototypes(
    categoryId?: number,
    page: number = 0,
    size: number = 20,
  ): Observable<PageDTO<PrototypeDTO>> {
    if (environment.useMockData) {
      const list = MOCK_PROTOTYPES.filter((p) => categoryId == null || p.categoryId === categoryId);
      return of(mockPage(list, page, size));
    }

    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    if (categoryId !== undefined && categoryId !== null) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get<PageDTO<PrototypeDTO>>(`${this.apiUrl}/me`, { params });
  }

  // 2. GET /api/v1/prototypes/{prototypeId}
  getOwnPrototype(prototypeId: number): Observable<PrototypeDTO> {
    if (environment.useMockData) {
      const p = MOCK_PROTOTYPES.find((x) => x.prototypeId === prototypeId);
      return p ? of(p) : throwError(() => new Error('Prototipo no encontrado'));
    }
    return this.http.get<PrototypeDTO>(`${this.apiUrl}/${prototypeId}`);
  }
}
