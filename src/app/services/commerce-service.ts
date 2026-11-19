import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FavoriteDTO } from '../model/favorite-dto';
import { Observable, of } from 'rxjs';
import { MOCK_INITIAL_FAVORITE_IDS, findMockProduct } from '../data/mock-data';

@Injectable({
  providedIn: 'root',
})
export class CommerceService {
  private apiUrl = environment.apiUrl;
  private readonly mockKey = 'marketar_mock_favorites';

  constructor(private http: HttpClient) {}
  // US03 David K.
  // 1. POST /users/me/favorites/{productId}
  addFavorite(productId: number): Observable<FavoriteDTO> {
    if (environment.useMockData) {
      const ids = this.readMockIds();
      if (!ids.includes(productId)) this.saveMockIds([productId, ...ids]);
      return of(this.toFavorite(productId));
    }
    return this.http.post<FavoriteDTO>(`${this.apiUrl}/users/me/favorites/${productId}`, null);
  }

  // 2. GET /users/me/favorites
  getFavorites(): Observable<FavoriteDTO[]> {
    if (environment.useMockData) {
      return of(this.readMockIds().map((id) => this.toFavorite(id)));
    }
    return this.http.get<FavoriteDTO[]>(`${this.apiUrl}/users/me/favorites`);
  }

  // 3. DELETE /users/me/favorites/{productId}
  removeFavorite(productId: number): Observable<void> {
    if (environment.useMockData) {
      this.saveMockIds(this.readMockIds().filter((id) => id !== productId));
      return of(void 0);
    }
    return this.http.delete<void>(`${this.apiUrl}/users/me/favorites/${productId}`);
  }

  // ---------- Soporte para datos internos (mock) ----------

  private toFavorite(productId: number): FavoriteDTO {
    return { favoriteId: productId, productId, productDTO: findMockProduct(productId) };
  }

  private readMockIds(): number[] {
    try {
      const raw = localStorage.getItem(this.mockKey);
      return raw ? (JSON.parse(raw) as number[]) : [...MOCK_INITIAL_FAVORITE_IDS];
    } catch {
      return [...MOCK_INITIAL_FAVORITE_IDS];
    }
  }

  private saveMockIds(ids: number[]): void {
    try {
      localStorage.setItem(this.mockKey, JSON.stringify(ids));
    } catch {
      /* almacenamiento no disponible */
    }
  }
}
