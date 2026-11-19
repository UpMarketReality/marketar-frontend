import { Injectable, signal } from '@angular/core';
import { ProductDTO } from '../model/product-dto';

export interface CartItem {
  product: ProductDTO;
  quantity: number;
}

// Carrito local (localStorage) para los productos agregados desde el catálogo.
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly storageKey = 'marketar_cart';
  readonly items = signal<CartItem[]>(this.read());

  add(product: ProductDTO, quantity: number = 1): void {
    const list = [...this.items()];
    const existing = list.find((i) => i.product.productId === product.productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      list.push({ product, quantity });
    }
    this.save(list);
  }

  remove(productId: number): void {
    this.save(this.items().filter((i) => i.product.productId !== productId));
  }

  clear(): void {
    this.save([]);
  }

  get count(): number {
    return this.items().reduce((acc, i) => acc + i.quantity, 0);
  }

  private save(list: CartItem[]): void {
    this.items.set(list);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private read(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
