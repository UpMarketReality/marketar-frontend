import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCard } from '@angular/material/card';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { OrderService } from '../../services/order-service';
import { OrderDTO } from '../../model/order-dto';

interface Pestana {
  valor: string;
  etiqueta: string;
}

interface Especificacion {
  clave: string;
  valor: string;
}

@Component({
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    MatTabNav,
    MatTabLink,
    MatTabNavPanel,
    MatTableModule,
    MatCard,
    MatFormField,
    MatPrefix,
    MatInput,
    MatIcon,
    MatButton,
  ],
  selector: 'app-vendedor-gestor-de-pedidos',
  styleUrl: './vendedor-gestor-de-pedidos.css',
  templateUrl: './vendedor-gestor-de-pedidos.html',
})
export class VendedorGestorDePedidos implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Cantidad de pedidos que se cargan (los filtros de pestaña trabajan sobre estos)
  readonly tamanoPagina = 50;

  private readonly etiquetasEstado: Record<string, string> = {
    CONFIRMADO: 'Confirmado',
    EN_FABRICACION: 'En fabricación',
    LISTO: 'Listo',
    ENVIADO: 'Enviado',
    ENTREGADO: 'Entregado',
  };

  // Nombres legibles de las claves de las especificaciones
  private readonly etiquetasClave: Record<string, string> = {
    material: 'Material',
    color: 'Color',
    dimensions: 'Medidas',
    width: 'Ancho',
    height: 'Alto',
    depth: 'Profundidad',
  };

  readonly pestanas: Pestana[] = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'pendientes', etiqueta: 'Pendientes' },
    { valor: 'fabricacion', etiqueta: 'En Proceso' },
    { valor: 'completados', etiqueta: 'Completados' },
  ];

  readonly columnas = ['id', 'cantidad', 'monto', 'estado', 'fecha'];

  // LISTADO (API)
  pedidos: OrderDTO[] = [];
  cargandoPedidos = true;
  errorPedidos = '';
  filtroActivo = 'todos';
  busqueda = '';

  // DETALLE (API): especificaciones del pedido
  pedidoSeleccionado: OrderDTO | null = null;
  especificaciones: Especificacion[] = [];
  cargandoDetalle = false;
  errorDetalle = '';

  ngOnInit(): void {
    this.cargarPedidos();
  }

  // Pedidos de la pestaña activa que coinciden con la búsqueda por ID
  get pedidosFiltrados(): OrderDTO[] {
    const texto = this.busqueda.trim();

    return this.pedidos.filter(
      (p) =>
        this.coincide(p, this.filtroActivo) && (!texto || String(p.orderId ?? '').includes(texto)),
    );
  }

  get mensajeVacio(): string {
    if (this.filtroActivo === 'pendientes') return 'No hay pedidos pendientes de fabricación.';
    if (this.filtroActivo === 'fabricacion') return 'No hay pedidos en proceso.';
    if (this.filtroActivo === 'completados') return 'No hay pedidos completados.';
    return 'Aún no tienes pedidos.';
  }

  // GET /api/v1/seller/orders
  cargarPedidos(): void {
    this.cargandoPedidos = true;
    this.errorPedidos = '';

    this.orderService.getSellerOrders(0, this.tamanoPagina).subscribe({
      next: (respuesta) => {
        this.pedidos = respuesta.content ?? [];
        this.cargandoPedidos = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoPedidos = false;
        this.errorPedidos = error.error?.message ?? 'No se pudieron cargar los pedidos.';
        this.cdr.markForCheck();
      },
    });
  }

  // GET /api/v1/seller/orders/{orderId}/specifications
  verDetalle(pedido: OrderDTO): void {
    if (pedido.orderId === undefined || this.cargandoDetalle) {
      return;
    }

    this.pedidoSeleccionado = null;
    this.especificaciones = [];
    this.errorDetalle = '';
    this.cargandoDetalle = true;

    this.orderService
      .getSellerOrderSpecifications(pedido.orderId)
      .pipe(
        finalize(() => {
          this.cargandoDetalle = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (detalle) => {
          this.pedidoSeleccionado = detalle;
          this.especificaciones = this.parsearEspecificaciones(detalle.specifications);
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.errorDetalle = error.error?.message ?? 'No se pudo cargar el pedido.';
          this.cdr.markForCheck();
        },
      });
  }

  contar(filtro: string): number {
    return this.pedidos.filter((p) => this.coincide(p, filtro)).length;
  }

  etiquetaEstado(estado?: string): string {
    return this.etiquetasEstado[estado ?? ''] ?? estado ?? '';
  }

  claseEstado(estado?: string): string {
    const clases: Record<string, string> = {
      CONFIRMADO: 'badge_confirmado',
      EN_FABRICACION: 'badge_fabricacion',
      LISTO: 'badge_listo',
      ENVIADO: 'badge_enviado',
      ENTREGADO: 'badge_entregado',
    };
    return clases[estado ?? ''] ?? '';
  }

  private coincide(pedido: OrderDTO, filtro: string): boolean {
    const estado = pedido.status ?? '';

    if (filtro === 'pendientes') return estado === 'CONFIRMADO';
    if (filtro === 'fabricacion') return ['EN_FABRICACION', 'LISTO', 'ENVIADO'].includes(estado);
    if (filtro === 'completados') return estado === 'ENTREGADO';
    return true;
  }

  // Convierte el texto de especificaciones (JSON) en filas legibles
  private parsearEspecificaciones(texto?: string | null): Especificacion[] {
    if (!texto) {
      return [];
    }

    try {
      const datos: unknown = JSON.parse(texto);

      if (datos === null || typeof datos !== 'object') {
        return [{ clave: 'Detalle', valor: texto }];
      }

      return Object.entries(datos as Record<string, unknown>).map(([clave, valor]) => ({
        clave: this.etiquetasClave[clave] ?? clave,
        valor: this.textoValor(valor),
      }));
    } catch {
      // Si no es JSON, se muestra el texto tal cual
      return [{ clave: 'Detalle', valor: texto }];
    }
  }

  private textoValor(valor: unknown): string {
    if (valor !== null && typeof valor === 'object') {
      const medidas = valor as Record<string, unknown>;
      const partes = Object.entries(medidas)
        .filter(([clave]) => clave !== 'unit')
        .map(([clave, dato]) => `${this.etiquetasClave[clave] ?? clave} ${dato}`);
      const unidad = medidas['unit'] ? ` ${medidas['unit']}` : '';
      return partes.join(' × ') + unidad;
    }
    return String(valor);
  }
}
