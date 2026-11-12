import { Injectable, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    if (categoryId !== undefined && categoryId !== null) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get<PageDTO<PrototypeDTO>>(`${this.apiUrl}/me`, { params });
  }

  // 2. GET /api/v1/prototypes/{prototypeId}
  getOwnPrototype(prototypeId: number): Observable<PrototypeDTO> {
    return this.http.get<PrototypeDTO>(`${this.apiUrl}/${prototypeId}`);
  }
}
