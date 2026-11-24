
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  CommerceService,
  PurchaseDTO
} from '../../services/commerce-service';

import { CartDTO } from '../../model/cart-dto';

@Component({
  imports: [RouterLink, CurrencyPipe],
  selector: 'app-pagos-componente',
  styleUrl: './pagos-componente.css',
  templateUrl: './pagos-componente.html',
})
export class PagosComponente implements OnInit {

  private readonly commerceService = inject(CommerceService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Datos reales del carrito
  cart: CartDTO | null = null;
  cargando = true;
  errorMessage = '';

  // Estado de confirmación del pedido
  confirmando = false;
  compraConfirmada: PurchaseDTO | null = null;
  errorCompra = '';

  // Evita registrar dos veces un mismo pedido
  private idempotencyKey: string | null = null;

  ngOnInit(): void {
    this.commerceService.getCart().subscribe({
      next: (respuesta) => {
        this.cart = respuesta;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage =
          'No se pudo cargar el resumen de compra.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Obtener la URL correcta de las imágenes
  imagenProducto(url?: string | null): string {
    if (!url) {
      return 'https://placehold.co/200x200?text=Producto';
    }

    return url.startsWith('/media/')
      ? 'http://localhost:8080' + url
      : url;
  }

  // Confirmar pedido simulado - US-28
  confirmarPedido(): void {

    // Evitar solicitudes simultáneas o repetidas
    if (
      this.confirmando ||
      this.compraConfirmada ||
      !this.cart ||
      this.cart.items.length === 0
    ) {
      return;
    }

    // PASO 1: Comprobar que exista el formulario
    const formulario = document.getElementById(
      'checkout-form'
    ) as HTMLFormElement | null;

    if (!formulario) {
      this.errorCompra =
        'No se encontró el formulario de compra.';
      this.cdr.markForCheck();
      return;
    }

    // PASO 2: Validar los campos obligatorios
    if (!formulario.reportValidity()) {
      this.errorCompra =
        'Completa correctamente los datos de contacto y envío.';
      this.cdr.markForCheck();
      return;
    }

    // PASO 3: Limpiar mensajes anteriores
    this.errorCompra = '';

    // PASO 4: Mantener la misma clave si se reintenta
    if (!this.idempotencyKey) {
      this.idempotencyKey = crypto.randomUUID();
    }

    // PASO 5: Activar el estado de confirmación
    this.confirmando = true;
    this.cdr.markForCheck();

    // PASO 6: Registrar el pedido simulado en Spring Boot
    this.commerceService
      .checkout(this.cart.cartId, this.idempotencyKey)
      .subscribe({
        next: (compra) => {
          this.compraConfirmada = compra;
          this.confirmando = false;
          this.errorCompra = '';
          this.cdr.markForCheck();
        },

        error: (error) => {
          if (error.status === 401) {
            this.errorCompra =
              'Tu sesión ha expirado. Inicia sesión nuevamente antes de confirmar.';
          } else {
            this.errorCompra =
              error.error?.message ??
              'No se pudo confirmar el pedido de prueba.';
          }

          this.confirmando = false;
          this.cdr.markForCheck();
        }
      });
  }
}
