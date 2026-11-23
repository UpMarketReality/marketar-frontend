import { Injectable } from '@angular/core';
import { ProductDTO } from '../model/product-dto';

// Guarda en el navegador los últimos productos reales con los que interactuó el usuario.
@Injectable({
  providedIn: 'root',
})
export class RecentlyViewedService {
  private readonly storageKey = 'marketar_recently_viewed';
  private readonly maxItems = 8;

  getAll(): ProductDTO[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        return JSON.parse(raw) as ProductDTO[];
      }
    } catch {
      /* almacenamiento no disponible */
    }
    return [];
  }

  add(product: ProductDTO): void {
    if (product.productId === undefined) return;
    const list = [product, ...this.getAll().filter((p) => p.productId !== product.productId)].slice(
      0,
      this.maxItems,
    );

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch {
      /* almacenamiento no disponible */
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      /* almacenamiento no disponible */
    }
  }
}
