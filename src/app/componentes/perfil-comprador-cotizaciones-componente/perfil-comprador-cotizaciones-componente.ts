import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { OfferDTO } from '../../model/offer-dto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { QuoteRequestDTO } from '../../model/quote-request-dto';
import { OrderDTO } from '../../model/order-dto';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PrototypeService } from '../../services/prototype-service';
import { QuoteService } from '../../services/quote-service';
import { CommonModule } from '@angular/common';

type FiltroCotizacion = 'TODAS' | 'ABIERTAS' | 'ACEPTADAS' | 'CERRADAS';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-perfil-comprador-cotizaciones-componente',
  styleUrl: './perfil-comprador-cotizaciones-componente.css',
  templateUrl: './perfil-comprador-cotizaciones-componente.html',
})
export class PerfilCompradorCotizacionesComponente implements OnInit, OnDestroy {
  private readonly quoteService = inject(QuoteService);
  private readonly prototypeService = inject(PrototypeService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  solicitudes: QuoteRequestDTO[] = [];
  solicitudSeleccionada: QuoteRequestDTO | null = null;
  ofertas: OfferDTO[] = [];

  cargandoSolicitudes = false;
  cargandoOfertas = false;
  procesando = false;

  errorGeneral = '';
  errorOfertas = '';
  mensajeExito = '';

  pedidoConfirmado: OrderDTO | null = null;

  filtro: FiltroCotizacion = 'TODAS';

  readonly filtros: {
    valor: FiltroCotizacion;
    texto: string;
  }[] = [
    { valor: 'TODAS', texto: 'Todas' },
    { valor: 'ABIERTAS', texto: 'En proceso' },
    { valor: 'ACEPTADAS', texto: 'Aceptadas' },
    { valor: 'CERRADAS', texto: 'Finalizadas' },
  ];

  paginaActual = 0;
  totalPaginas = 0;
  readonly tamanioPagina = 10;

  private readonly imagenes = new Map<number, string>();
  private readonly imagenesIntentadas = new Set<number>();

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  get solicitudesFiltradas(): QuoteRequestDTO[] {
    switch (this.filtro) {
      case 'ABIERTAS':
        return this.solicitudes.filter((s) => this.estaAbierta(s));

      case 'ACEPTADAS':
        return this.solicitudes.filter((s) => s.status === 'ACEPTADA');

      case 'CERRADAS':
        return this.solicitudes.filter((s) => ['CANCELADA', 'COMPLETADA'].includes(s.status ?? ''));

      default:
        return this.solicitudes;
    }
  }

  estaAbierta(solicitud: QuoteRequestDTO): boolean {
    return ['EN_COTIZACION', 'COTIZADA'].includes(solicitud.status ?? '');
  }

  cargarSolicitudes(pagina = 0): void {
    if (this.cargandoSolicitudes) return;

    this.cargandoSolicitudes = true;
    this.errorGeneral = '';

    this.quoteService
      .getMyQuoteRequests(pagina, this.tamanioPagina)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargandoSolicitudes = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.solicitudes = respuesta.content ?? [];
          this.paginaActual = respuesta.page ?? respuesta.number ?? pagina;
          this.totalPaginas = respuesta.totalPages ?? 0;

          for (const solicitud of this.solicitudes) {
            this.cargarImagen(solicitud);
          }

          const parametro = Number(this.route.snapshot.queryParamMap.get('requestId'));

          const idSeleccionado = this.solicitudSeleccionada?.requestId ?? parametro;

          const seleccionada =
            this.solicitudes.find((s) => s.requestId === idSeleccionado) ?? this.solicitudes[0];

          if (seleccionada) {
            this.seleccionarSolicitud(seleccionada);
          } else {
            this.solicitudSeleccionada = null;
            this.ofertas = [];
            this.cargandoOfertas = false;
          }

          this.cdr.markForCheck();
        },

        error: (error) => {
          this.errorGeneral = this.mensajeHttp(error, 'No se pudieron cargar tus cotizaciones.');
          this.cdr.markForCheck();
        },
      });
  }

  seleccionarSolicitud(solicitud: QuoteRequestDTO): void {
    if (solicitud.requestId == null) return;

    const requestId = solicitud.requestId;

    this.solicitudSeleccionada = solicitud;
    this.ofertas = [];
    this.errorOfertas = '';
    this.cargandoOfertas = true;
    this.pedidoConfirmado = null;

    this.quoteService
      .getOffersForRequest(requestId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.solicitudSeleccionada?.requestId === requestId) {
            this.cargandoOfertas = false;
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (ofertas) => {
          if (this.solicitudSeleccionada?.requestId === requestId) {
            this.ofertas = ofertas;
            this.cdr.markForCheck();
          }
        },

        error: (error) => {
          if (this.solicitudSeleccionada?.requestId === requestId) {
            this.errorOfertas = this.mensajeHttp(error, 'No se pudieron cargar las ofertas.');
            this.cdr.markForCheck();
          }
        },
      });
  }

  private cargarImagen(solicitud: QuoteRequestDTO): void {
    const id = solicitud.requestId;
    const prototipoId = solicitud.prototypeId;
    const url = solicitud.images?.[0];

    if (id == null || prototipoId == null || !url || this.imagenesIntentadas.has(id)) {
      return;
    }

    this.imagenesIntentadas.add(id);

    this.prototypeService
      .obtenerImagen(prototipoId, url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          if (blob.size > 0 && blob.type.startsWith('image/')) {
            this.imagenes.set(id, URL.createObjectURL(blob));
            this.cdr.markForCheck();
          }
        },

        error: (error) => {
          console.warn('No se pudo cargar la imagen de solicitud', id, error);
        },
      });
  }

  imagenSolicitud(solicitud: QuoteRequestDTO): string | null {
    return this.imagenes.get(solicitud.requestId ?? -1) ?? null;
  }

  puedeAceptar(oferta: OfferDTO): boolean {
    if (
      !this.solicitudSeleccionada ||
      !this.estaAbierta(this.solicitudSeleccionada) ||
      this.procesando
    ) {
      return false;
    }

    const vencimiento = new Date(oferta.expiresAt).getTime();

    return (
      oferta.status === 'PENDIENTE' &&
      !oferta.isExpired &&
      Number.isFinite(vencimiento) &&
      vencimiento > Date.now()
    );
  }

  aceptarOferta(oferta: OfferDTO): void {
    if (!this.puedeAceptar(oferta)) return;

    const confirmar = window.confirm(
      `¿Deseas aceptar la oferta de ${oferta.storeName} ` +
        `por S/ ${oferta.amount.toFixed(2)}? ` +
        'Las demás ofertas pendientes serán rechazadas.',
    );

    if (!confirmar) return;

    this.procesando = true;
    this.errorGeneral = '';
    this.mensajeExito = '';

    this.quoteService
      .acceptOffer(oferta.offerId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.procesando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (pedido) => {
          this.pedidoConfirmado = pedido;

          this.mensajeExito =
            `Oferta aceptada correctamente. ` + `Se generó el pedido #${pedido.orderId}.`;

          this.cargarSolicitudes(this.paginaActual);
        },

        error: (error) => {
          this.errorGeneral = this.mensajeHttp(error, 'No se pudo aceptar la oferta.');

          // En caso de conflicto se puede refrescar
          // para recuperar el estado real del servidor.
          if (error.status === 409) {
            this.cargarSolicitudes(this.paginaActual);
          }

          this.cdr.markForCheck();
        },
      });
  }

  cancelarSolicitud(solicitud: QuoteRequestDTO): void {
    if (!this.estaAbierta(solicitud) || solicitud.requestId == null || this.procesando) {
      return;
    }

    const confirmar = window.confirm(
      '¿Deseas cancelar esta solicitud? ' + 'Las ofertas pendientes serán rechazadas.',
    );

    if (!confirmar) return;

    this.procesando = true;
    this.errorGeneral = '';
    this.mensajeExito = '';

    this.quoteService
      .cancelQuoteRequest(solicitud.requestId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.procesando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.mensajeExito = 'La solicitud se canceló correctamente.';

          this.cargarSolicitudes(this.paginaActual);
        },

        error: (error) => {
          this.errorGeneral = this.mensajeHttp(error, 'No se pudo cancelar la solicitud.');
          this.cdr.markForCheck();
        },
      });
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas || this.cargandoSolicitudes) {
      return;
    }

    this.solicitudSeleccionada = null;
    this.ofertas = [];
    this.cargarSolicitudes(pagina);
  }

  estadoTexto(estado?: string): string {
    switch (estado) {
      case 'EN_COTIZACION':
        return 'Esperando ofertas';
      case 'COTIZADA':
        return 'Ofertas recibidas';
      case 'ACEPTADA':
        return 'Oferta aceptada';
      case 'CANCELADA':
        return 'Cancelada';
      case 'COMPLETADA':
        return 'Completada';
      default:
        return estado ?? 'Sin estado';
    }
  }

  claseEstado(estado?: string): string {
    switch (estado) {
      case 'EN_COTIZACION':
        return 'badge badge--orange';
      case 'COTIZADA':
        return 'badge badge--blue';
      case 'ACEPTADA':
      case 'COMPLETADA':
        return 'badge badge--green';
      case 'CANCELADA':
        return 'badge badge--gray';
      default:
        return 'badge';
    }
  }

  estadoOferta(oferta: OfferDTO): string {
    if (oferta.status === 'PENDIENTE' && oferta.isExpired) {
      return 'Vencida';
    }

    switch (oferta.status) {
      case 'PENDIENTE':
        return 'Disponible';
      case 'ACEPTADA':
        return 'Aceptada';
      case 'RECHAZADA':
        return 'No seleccionada';
      default:
        return oferta.status;
    }
  }

  private mensajeHttp(error: HttpErrorResponse, mensajeDefault: string): string {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    if (error.status === 401) {
      return 'Tu sesión expiró. Inicia sesión nuevamente.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }

    if (error.status === 409) {
      return typeof error.error?.message === 'string'
        ? error.error.message
        : 'Esta solicitud ya no admite cambios.';
    }

    return typeof error.error?.message === 'string' ? error.error.message : mensajeDefault;
  }
  cambiarFiltro(valor: FiltroCotizacion): void {
    this.filtro = valor;

    const visibles = this.solicitudesFiltradas;

    const seleccionActualVisible = visibles.some(
      (s) => s.requestId === this.solicitudSeleccionada?.requestId,
    );

    if (!seleccionActualVisible) {
      if (visibles.length > 0) {
        this.seleccionarSolicitud(visibles[0]);
      } else {
        this.solicitudSeleccionada = null;
        this.ofertas = [];
      }
    }
  }

  ngOnDestroy(): void {
    for (const url of this.imagenes.values()) {
      URL.revokeObjectURL(url);
    }

    this.imagenes.clear();
  }
}
