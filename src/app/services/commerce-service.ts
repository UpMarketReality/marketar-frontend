
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartDTO } from '../model/cart-dto';
import { ProductDTO } from '../model/product-dto';

// =========================================
// MODELO DE FAVORITOS
// =========================================

export interface FavoriteDTO {
  favoriteId: number;
  productId: number;
  product: ProductDTO;
}

// =========================================
// MODELOS DE COMPRA
// =========================================

export interface PurchaseItemDTO {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface PurchaseDTO {
  purchaseId: number;
  date: string;
  items: PurchaseItemDTO[];
  total: number;
  method: string;
  status: string;
}

// =========================================
// SERVICIO DE COMERCIO
// =========================================

@Injectable({
  providedIn: 'root',
})
export class CommerceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1`;

  // =========================================
  // CARRITO - US-04
  // =========================================

  // Obtener carrito del comprador
  getCart(): Observable<CartDTO> {
    return this.http.get<CartDTO>(
      `${this.baseUrl}/cart`
    );
  }

  // Agregar un producto al carrito
  addItem(
    productId: number,
    quantity: number = 1
  ): Observable<CartDTO> {
    return this.http.post<CartDTO>(
      `${this.baseUrl}/cart/items`,
      {
        productId,
        quantity,
      }
    );
  }

  // Actualizar la cantidad de un producto
  updateQuantity(
    itemId: number,
    quantity: number
  ): Observable<CartDTO> {
    return this.http.patch<CartDTO>(
      `${this.baseUrl}/cart/items/${itemId}`,
      {
        quantity,
      }
    );
  }

  // Eliminar un producto del carrito
  // Spring Boot responde HTTP 204 sin contenido
  removeItem(itemId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/cart/items/${itemId}`
    );
  }

  // =========================================
  // CHECKOUT - US-28
  // =========================================

  // Registrar una compra simulada en Spring Boot
  // Requiere una clave de idempotencia y el ID del carrito
  checkout(
    cartId: number,
    idempotencyKey: string
  ): Observable<PurchaseDTO> {
    return this.http.post<PurchaseDTO>(
      `${this.baseUrl}/cart/checkout`,
      {},
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
          'X-Cart-Id': String(cartId),
        },
      }
    );
  }

  // Obtener las compras del comprador
  getPurchases(
    page: number = 0,
    size: number = 20
  ): Observable<unknown> {
    return this.http.get<unknown>(
      `${this.baseUrl}/purchases/me`,
      {
        params: {
          page: String(page),
          size: String(size),
        },
      }
    );
  }

  // Obtener una compra por su ID
  getPurchaseById(
    purchaseId: number
  ): Observable<PurchaseDTO> {
    return this.http.get<PurchaseDTO>(
      `${this.baseUrl}/purchases/${purchaseId}`
    );
  }

  // =========================================
  // FAVORITOS
  // =========================================

  // Obtener favoritos
  getFavorites(): Observable<FavoriteDTO[]> {
    return this.http.get<FavoriteDTO[]>(
      `${this.baseUrl}/users/me/favorites`
    );
  }

  // Agregar un producto a favoritos
  addFavorite(
    productId: number
  ): Observable<FavoriteDTO> {
    return this.http.post<FavoriteDTO>(
      `${this.baseUrl}/users/me/favorites/${productId}`,
      {}
    );
  }

  // Eliminar un producto de favoritos
  removeFavorite(
    productId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/users/me/favorites/${productId}`
    );
  }
}

