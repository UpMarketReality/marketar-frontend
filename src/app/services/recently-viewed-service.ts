import { Injectable } from '@angular/core';
import { MOCK_INITIAL_RECENT_IDS, findMockProduct } from '../data/mock-data';
import { ProductDTO } from '../model/product-dto';
import { environment } from '../../environments/environment';

// Guarda en el navegador los últimos productos con los que interactuó el usuario.
@Injectable({
  providedIn: 'root',
})
export class RecentlyViewedService {
  private readonly storageKey = 'marketar_recently_viewed';
  private readonly maxItems = 8;

  getAll(): ProductDTO[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw) as ProductDTO[];
    } catch {
      /* almacenamiento no disponible */
    }
    // Sin historial: en modo mock se muestran datos de ejemplo
    return environment.useMockData
      ? MOCK_INITIAL_RECENT_IDS.map((id) => findMockProduct(id)).filter((p): p is ProductDTO => !!p)
      : [];
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
