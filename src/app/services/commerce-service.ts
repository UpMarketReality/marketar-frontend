import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FavoriteDTO } from '../model/favorite-dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommerceService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}
  // US03 David K.
  // 1. POST /users/me/favorites/{productId}
  addFavorite(productId: number): Observable<FavoriteDTO> {
    return this.http.post<FavoriteDTO>(`${this.apiUrl}/users/me/favorites/${productId}`, null);
  }

  // 2. GET /users/me/favorites
  getFavorites(): Observable<FavoriteDTO[]> {
    return this.http.get<FavoriteDTO[]>(`${this.apiUrl}/users/me/favorites`);
  }

  // 3. DELETE /users/me/favorites/{productId}
  removeFavorite(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/me/favorites/${productId}`);
  }
}

