
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommerceService } from '../../services/commerce-service';
import { CartDTO } from '../../model/cart-dto';

@Component({
  selector: 'app-carrito',
  imports: [RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito implements OnInit {
  private readonly commerceService = inject(CommerceService);

  readonly cart = signal<CartDTO | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    this.loadCart();
  }

  // Obtener el carrito actualizado desde Spring Boot
  loadCart(): void {
    this.loading.set(true);
    this.error.set('');

    this.commerceService.getCart().subscribe({
      next: (cart) => {
        this.cart.set(cart);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el carrito.');
        this.loading.set(false);
      },
    });
  }

  // Eliminar un producto del carrito
  removeItem(itemId: number): void {
    this.error.set('');

    this.commerceService.removeItem(itemId).subscribe({
      next: () => {
        // DELETE responde 204 sin contenido.
        // Consultamos nuevamente el carrito actualizado.
        this.loadCart();
      },
      error: () => {
        this.error.set('No se pudo eliminar el producto.');
      },
    });
  }

  // Aumentar o disminuir la cantidad de un producto
  updateQuantity(itemId: number, quantity: number): void {
    if (quantity < 1) {
      return;
    }

    this.error.set('');

    this.commerceService.updateQuantity(itemId, quantity).subscribe({
      next: (cart) => {
        this.cart.set(cart);
      },
      error: () => {
        this.error.set('No se pudo actualizar la cantidad.');
      },
    });
  }
}
