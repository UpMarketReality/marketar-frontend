import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, expand, finalize, reduce } from 'rxjs';
import { OrderDTO } from '../../model/order-dto';
import { OrderService } from '../../services/order-service';
import { PrototypeService } from '../../services/prototype-service';
import { QuoteService } from '../../services/quote-service';

type FiltroPedido = 'TODOS' | 'EN_CURSO' | 'ENTREGADOS';

interface EtapaPedido {
  codigo: string;
  titulo: string;
}

interface EspecificacionPedido {
  nombre: string;
  valor: string;
}

@Component({
  selector: 'app-perfil-comprador-pedidos-componente',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './perfil-comprador-pedidos-componente.html',
  styleUrl: './perfil-comprador-pedidos-componente.css',
})
export class PerfilCompradorPedidosComponente implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly quoteService = inject(QuoteService);
  private readonly prototypeService = inject(PrototypeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly etapas: readonly EtapaPedido[] = [
    { codigo: 'CONFIRMADO', titulo: 'Confirmado' },
    { codigo: 'EN_FABRICACION', titulo: 'En fabricación' },
    { codigo: 'LISTO', titulo: 'Listo' },
    { codigo: 'ENVIADO', titulo: 'Enviado' },
    { codigo: 'ENTREGADO', titulo: 'Entregado' },
  ];

  readonly tamanoPaginaVista = 6;
  readonly tamanoPaginaApi = 100;

  pedidos: OrderDTO[] = [];
  cargandoPedidos = false;
  errorPedidos = '';
  filtro: FiltroPedido = 'TODOS';
  paginaVista = 0;

  detalleId: number | null = null;
  detalle: OrderDTO | null = null;
  cargandoDetalle = false;
  errorDetalle = '';
  especificaciones: EspecificacionPedido[] = [];

  private readonly imagenes = new Map<number, string>();
  private readonly imagenesIntentadas = new Set<number>();
  private readonly nombresSolicitud = new Map<number, string>();

  ngOnInit(): void {
    this.cargarPedidos();
  }

  ngOnDestroy(): void {
    for (const url of this.imagenes.values()) {
      URL.revokeObjectURL(url);
    }
    this.imagenes.clear();
  }

  get totalPedidos(): number {
    return this.pedidos.length;
  }

  get totalEnCurso(): number {
    return this.pedidos.filter((p) => p.status !== 'ENTREGADO').length;
  }

  get totalEntregados(): number {
    return this.pedidos.filter((p) => p.status === 'ENTREGADO').length;
  }

  get pedidosFiltrados(): OrderDTO[] {
    if (this.filtro === 'EN_CURSO') {
      return this.pedidos.filter((p) => p.status !== 'ENTREGADO');
    }
    if (this.filtro === 'ENTREGADOS') {
      return this.pedidos.filter((p) => p.status === 'ENTREGADO');
    }
    return this.pedidos;
  }

  get totalPaginasVista(): number {
    return Math.max(1, Math.ceil(this.pedidosFiltrados.length / this.tamanoPaginaVista));
  }

  get pedidosPagina(): OrderDTO[] {
    const desde = this.paginaVista * this.tamanoPaginaVista;
    return this.pedidosFiltrados.slice(desde, desde + this.tamanoPaginaVista);
  }

  get primerResultado(): number {
    return this.pedidosFiltrados.length === 0 ? 0 : this.paginaVista * this.tamanoPaginaVista + 1;
  }

  get ultimoResultado(): number {
    return Math.min((this.paginaVista + 1) * this.tamanoPaginaVista, this.pedidosFiltrados.length);
  }

  // Se consultan todas las páginas del comprador para que los filtros y
  // los contadores sean globales, no únicamente de la primera página.
  cargarPedidos(): void {
    if (this.cargandoPedidos) return;
    this.cargandoPedidos = true;
    this.errorPedidos = '';

    this.orderService
      .getMyOrders(0, this.tamanoPaginaApi)
      .pipe(
        expand((respuesta, indice) => {
          const paginaActual = respuesta.page ?? indice;
          const totalPaginas = respuesta.totalPages ?? 0;
          return paginaActual + 1 < totalPaginas
            ? this.orderService.getMyOrders(paginaActual + 1, this.tamanoPaginaApi)
            : EMPTY;
        }),
        reduce((acumulado, pagina) => {
          acumulado.push(...(pagina.content ?? []));
          return acumulado;
        }, [] as OrderDTO[]),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargandoPedidos = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (pedidos) => {
          this.pedidos = pedidos.sort((a, b) => {
            const fechaA = a.createdAt ? Date.parse(a.createdAt) || 0 : 0;
            const fechaB = b.createdAt ? Date.parse(b.createdAt) || 0 : 0;
            return fechaB - fechaA || (b.orderId ?? 0) - (a.orderId ?? 0);
          });
          this.paginaVista = Math.min(this.paginaVista, this.totalPaginasVista - 1);
          this.cerrarDetalle();
          this.cargarImagenesVisibles();
          if (this.pedidos.length > 0) this.cargarNombres();
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.errorPedidos = this.mensajeHttp(error, 'No se pudieron cargar tus encargos.');
          this.cdr.markForCheck();
        },
      });
  }

  cambiarFiltro(filtro: FiltroPedido): void {
    if (this.filtro === filtro) return;
    this.filtro = filtro;
    this.paginaVista = 0;
    this.cerrarDetalle();
    this.cargarImagenesVisibles();
  }

  irPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginasVista || pagina === this.paginaVista) return;
    this.paginaVista = pagina;
    this.cerrarDetalle();
    this.cargarImagenesVisibles();
  }

  abrirDetalle(pedido: OrderDTO): void {
    const id = pedido.orderId;
    if (id == null) return;
    if (this.detalleId === id) {
      this.cerrarDetalle();
      return;
    }

    this.detalleId = id;
    this.detalle = null;
    this.cargandoDetalle = true;
    this.errorDetalle = '';
    this.especificaciones = [];

    this.orderService
      .getMyOrderById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalle) => {
          if (this.detalleId !== id) return;
          this.detalle = detalle;
          this.especificaciones = this.parsearEspecificaciones(detalle.specifications);
          this.cargandoDetalle = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          if (this.detalleId !== id) return;
          this.errorDetalle = this.mensajeHttp(
            error,
            'No se pudo consultar el detalle del encargo.',
          );
          this.cargandoDetalle = false;
          this.cdr.markForCheck();
        },
      });
  }

  reintentarDetalle(pedido: OrderDTO): void {
    this.cerrarDetalle();
    this.abrirDetalle(pedido);
  }

  cerrarDetalle(): void {
    this.detalleId = null;
    this.detalle = null;
    this.cargandoDetalle = false;
    this.errorDetalle = '';
    this.especificaciones = [];
  }

  etiquetaEstado(estado?: string): string {
    return this.etapas.find((p) => p.codigo === estado)?.titulo ?? (estado || 'Sin estado');
  }

  indiceEstado(estado?: string): number {
    return this.etapas.findIndex((p) => p.codigo === estado);
  }

  claseEstado(estado?: string): string {
    const clases: Record<string, string> = {
      CONFIRMADO: 'estado--confirmado',
      EN_FABRICACION: 'estado--fabricacion',
      LISTO: 'estado--listo',
      ENVIADO: 'estado--enviado',
      ENTREGADO: 'estado--entregado',
    };
    return clases[estado ?? ''] ?? 'estado--neutro';
  }

  nombrePedido(pedido: OrderDTO): string {
    const nombre = this.nombresSolicitud.get(pedido.requestId ?? -1);
    return nombre || `Diseño personalizado #${pedido.prototypeId ?? pedido.orderId ?? ''}`;
  }

  imagenPedido(pedido: OrderDTO): string | null {
    return this.imagenes.get(pedido.orderId ?? -1) ?? null;
  }

  private cargarNombres(): void {
    // Se reutiliza el listado de solicitudes del comprador; si falla,
    // el historial sigue funcionando y muestra el ID del prototipo.
    this.quoteService
      .getAllMyQuoteRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (solicitudes) => {
          for (const solicitud of solicitudes) {
            if (solicitud.requestId != null && solicitud.prototype) {
              this.nombresSolicitud.set(solicitud.requestId, solicitud.prototype);
            }
          }
          this.cdr.markForCheck();
        },
        error: () => {
          /* El nombre es un dato visual opcional. */
        },
      });
  }

  private cargarImagenesVisibles(): void {
    for (const pedido of this.pedidosPagina) {
      const id = pedido.orderId;
      const prototipoId = pedido.prototypeId;
      const imagen = pedido.images?.[0];

      if (id == null || prototipoId == null || !imagen || this.imagenesIntentadas.has(id)) continue;
      this.imagenesIntentadas.add(id);

      try {
        this.prototypeService
          .obtenerImagen(prototipoId, imagen)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (blob) => {
              if (blob.size > 0 && blob.type.startsWith('image/')) {
                this.imagenes.set(id, URL.createObjectURL(blob));
                this.cdr.markForCheck();
              }
            },
            error: () => {
              /* Se conserva el ícono de reemplazo. */
            },
          });
      } catch {
        // Una URL de referencia no válida no bloquea el historial.
      }
    }
  }

  private parsearEspecificaciones(texto?: string): EspecificacionPedido[] {
    if (!texto?.trim()) return [];
    try {
      const json: unknown = JSON.parse(texto);
      if (!json || typeof json !== 'object' || Array.isArray(json)) {
        return [{ nombre: 'Descripción', valor: texto }];
      }
      return Object.entries(json as Record<string, unknown>).map(([clave, valor]) => ({
        nombre: this.etiquetaClave(clave),
        valor: this.valorEspecificacion(valor),
      }));
    } catch {
      return [{ nombre: 'Descripción', valor: texto }];
    }
  }

  private etiquetaClave(clave: string): string {
    const nombres: Record<string, string> = {
      material: 'Material',
      color: 'Color',
      dimensions: 'Dimensiones',
      width: 'Ancho',
      height: 'Alto',
      depth: 'Profundidad',
      unit: 'Unidad',
      size: 'Talla',
      capacityMl: 'Capacidad (ml)',
    };
    return nombres[clave] ?? clave;
  }

  private valorEspecificacion(valor: unknown): string {
    if (valor === null || valor === undefined) return 'No especificado';
    if (Array.isArray(valor)) return valor.map((v) => this.valorEspecificacion(v)).join(', ');
    if (typeof valor === 'object') {
      const campos = valor as Record<string, unknown>;
      const unidad = typeof campos['unit'] === 'string' ? ` ${campos['unit']}` : '';
      return Object.entries(campos)
        .filter(([clave]) => clave !== 'unit')
        .map(
          ([clave, dato]) =>
            `${this.etiquetaClave(clave)}: ${this.valorEspecificacion(dato)}${unidad}`,
        )
        .join(' · ');
    }
    return String(valor);
  }

  private mensajeHttp(error: HttpErrorResponse, alternativo: string): string {
    if (error.status === 0)
      return 'No se pudo conectar con el servidor. Comprueba que el backend esté encendido.';
    if (error.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'No tienes permisos para consultar estos encargos.';
    if (error.status === 404) return 'No se encontró este encargo.';
    return typeof error.error?.message === 'string' ? error.error.message : alternativo;
  }
}
