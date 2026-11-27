import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCard } from '@angular/material/card';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { ReportService } from '../../services/report-service';
import { QuoteService } from '../../services/quote-service';
import { CatalogService } from '../../services/catalog-service';
import { SalesReportDTO } from '../../model/sales-report-dto';
import { QuoteRequestDTO } from '../../model/quote-request-dto';
import { CategoryDTO } from '../../model/category-dto';
import { OfferRequest } from '../../model/offer-request';
import { OfferDTO } from '../../model/offer-dto';

interface Movimiento {
  fecha: string;
  concepto: string;
  referencia: string;
  monto: string;
  estado: string;
}

interface Pestana {
  estado: string;
  etiqueta: string;
  titulo: string;
}

@Component({
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    MatTabNav,
    MatTabLink,
    MatTableModule,
    MatCard,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatInput,
    MatIcon,
    MatButton,
    MatSelect,
    MatOption,
    MatTabNavPanel,
  ],
  selector: 'app-vendedor-cotizaciones',
  styleUrl: './vendedor-cotizaciones.css',
  templateUrl: './vendedor-cotizaciones.html',
})
export class VendedorCotizaciones implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly quoteService = inject(QuoteService);
  private readonly catalogService = inject(CatalogService);
  private readonly cdr = inject(ChangeDetectorRef);

  // LÍMITES DEL BACKEND (OfferRequest)
  readonly tamanoPagina = 10;
  readonly maximoCondiciones = 1000;
  readonly maximoMonto = 99999999.99;

  // FILTRO DE FECHAS DEL REPORTE (formato YYYY-MM-DD)
  fechaInicio = '';
  fechaFin = '';

  // Ventas del período que llegan de la API (null hasta elegir un período válido)
  ventas: SalesReportDTO | null = null;
  errorMessage = '';

  // Pestaña principal: cotizaciones o finanzas
  pestanaPrincipal = 'cotizaciones';

  // Estado de cotización activo en las pestañas
  pestanaCotizacion = 'Nueva Solicitud';

  // Pestaña financiera: movimientos o retiros
  pestanaFinanzas = 'movimientos';

  // Estos datos aún no tienen endpoint en finanzas
  movimientos: Movimiento[] = [];

  // NUEVAS SOLICITUDES (API: solicitudes abiertas)
  solicitudes: QuoteRequestDTO[] = [];
  categorias: CategoryDTO[] = [];
  categoriaId: number | null = null;
  cargandoSolicitudes = true;
  errorSolicitudes = '';
  pagina = 0;
  totalPaginas = 0;
  totalSolicitudes = 0;

  // OFERTAS DEL VENDEDOR (API): pestaña -> estado del backend
  readonly estadoOferta: Record<string, string> = {
    Enviada: 'PENDIENTE',
    Aceptada: 'ACEPTADA',
    Rechazada: 'RECHAZADA',
  };
  conteoOfertas: Record<string, number> = { Enviada: 0, Aceptada: 0, Rechazada: 0 };
  ofertas: OfferDTO[] = [];
  cargandoOfertas = false;
  errorOfertas = '';

  // SOLICITUD ABIERTA Y FORMULARIO DE OFERTA
  seleccionada: QuoteRequestDTO | null = null;
  cargandoDetalle = false;
  enviando = false;
  monto: number | null = null;
  plazoDias: number | null = null;
  vencimiento = '';
  condiciones = '';

  // MENSAJE DE LA OFERTA (se muestra encima de la tabla)
  mensajeOferta = '';
  tipoMensajeOferta: 'exito' | 'error' = 'exito';

  // Estructura fija
  readonly pestanas: Pestana[] = [
    { estado: 'Nueva Solicitud', etiqueta: 'Nuevas Solicitudes', titulo: 'Nuevas Solicitudes' },
    { estado: 'Enviada', etiqueta: 'Enviadas', titulo: 'Ofertas Enviadas' },
    { estado: 'Aceptada', etiqueta: 'Aceptadas', titulo: 'Ofertas Aceptadas' },
    { estado: 'Rechazada', etiqueta: 'Rechazadas', titulo: 'Ofertas Rechazadas' },
  ];

  readonly columnasSolicitudes = ['id', 'proyecto', 'cantidad', 'ofertas', 'fecha', 'estado'];
  readonly columnasOfertas = ['id', 'monto', 'plazo', 'vence', 'estado'];
  readonly columnasMovimientos = ['fecha', 'concepto', 'referencia', 'monto', 'estado'];

  ngOnInit(): void {
    this.catalogService.getPrototypeCategories().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cdr.markForCheck();
      },
      error: () => {
        this.categorias = [];
      },
    });

    // Se cargan al entrar para mostrar los contadores de las pestañas
    this.cargarSolicitudes(0);
    this.cargarConteosOfertas();
  }

  // Verdadero si el inicio es posterior al fin
  get rangoInvalido(): boolean {
    return !!this.fechaInicio && !!this.fechaFin && this.fechaInicio > this.fechaFin;
  }

  // Ventas brutas del período en formato S/
  get ventasBrutasTexto(): string {
    if (!this.ventas) return '—';
    return (
      'S/ ' +
      this.ventas.netSalesAmount.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  // Pestaña de estado que está activa
  get pestanaActual(): Pestana {
    return this.pestanas.find((p) => p.estado === this.pestanaCotizacion) ?? this.pestanas[0];
  }

  // Fecha mínima para la oferta: mañana
  get fechaMinima(): string {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return this.formatearFecha(manana);
  }

  // Se llama cada vez que cambia una fecha
  alCambiarPeriodo(): void {
    this.errorMessage = '';

    // Sin período completo y válido no se consulta la API
    if (!this.fechaInicio || !this.fechaFin || this.rangoInvalido) {
      this.ventas = null;
      return;
    }

    this.reportService.getSales(this.fechaInicio, this.fechaFin).subscribe({
      next: (respuesta) => {
        this.ventas = respuesta;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.ventas = null;
        this.errorMessage =
          error.error?.message ?? 'No se pudo cargar el reporte. Inténtalo nuevamente.';
        this.cdr.markForCheck();
      },
    });
  }

  // GET /api/v1/seller/quote-requests
  cargarSolicitudes(pagina: number): void {
    this.cargandoSolicitudes = true;
    this.errorSolicitudes = '';

    this.quoteService
      .getOpenQuoteRequests(this.categoriaId ?? undefined, pagina, this.tamanoPagina)
      .subscribe({
        next: (respuesta) => {
          this.solicitudes = respuesta.content ?? [];
          this.pagina = respuesta.number ?? pagina;
          this.totalPaginas = respuesta.totalPages ?? 0;
          this.totalSolicitudes = respuesta.totalElements ?? this.solicitudes.length;
          this.cargandoSolicitudes = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.cargandoSolicitudes = false;
          this.errorSolicitudes = error.error?.message ?? 'No se pudieron cargar las solicitudes.';
          this.cdr.markForCheck();
        },
      });
  }

  cambiarCategoria(): void {
    this.cerrarDetalle();
    this.cargarSolicitudes(0);
  }

  paginaAnterior(): void {
    if (this.pagina > 0) {
      this.cargarSolicitudes(this.pagina - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.pagina < this.totalPaginas - 1) {
      this.cargarSolicitudes(this.pagina + 1);
    }
  }

  cambiarPestana(estado: string): void {
    this.pestanaCotizacion = estado;
    this.cerrarDetalle();
    this.mensajeOferta = '';

    if (this.estadoOferta[estado]) {
      this.cargarOfertas(estado);
    }
  }

  // GET /api/v1/seller/quote-requests/{requestId}
  verDetalle(solicitud: QuoteRequestDTO): void {
    if (solicitud.requestId === undefined || this.cargandoDetalle) {
      return;
    }

    this.cargandoDetalle = true;
    this.mensajeOferta = '';

    this.quoteService.getSellerQuoteRequestDetail(solicitud.requestId).subscribe({
      next: (detalle) => {
        this.seleccionada = detalle;
        this.limpiarFormulario();
        this.cargandoDetalle = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoDetalle = false;
        this.mostrarMensajeOferta(
          error.error?.message ?? 'Esta solicitud ya no está disponible.',
          'error',
        );
        this.cargarSolicitudes(this.pagina);
      },
    });
  }

  cerrarDetalle(): void {
    this.seleccionada = null;
    this.limpiarFormulario();
  }

  // Revisa los mismos límites que OfferRequest del backend
  private validarOferta(): string | null {
    if (this.monto === null || this.monto <= 0 || this.monto > this.maximoMonto) {
      return 'Ingresa un monto total mayor a 0.';
    }
    if (this.plazoDias === null || !Number.isInteger(this.plazoDias) || this.plazoDias < 1) {
      return 'El plazo de entrega debe ser un número entero de días mayor a 0.';
    }
    if (!this.vencimiento || this.vencimiento < this.fechaMinima) {
      return 'La oferta debe vencer en una fecha futura.';
    }
    if (!this.condiciones.trim() || this.condiciones.length > this.maximoCondiciones) {
      return `Escribe las condiciones (máximo ${this.maximoCondiciones} caracteres).`;
    }
    return null;
  }

  // POST /api/v1/seller/quote-requests/{requestId}/offers
  enviarOferta(): void {
    if (this.enviando || !this.seleccionada || this.seleccionada.requestId === undefined) {
      return;
    }

    const error = this.validarOferta();

    if (error) {
      this.mostrarMensajeOferta(error, 'error');
      return;
    }

    const datos: OfferRequest = {
      amount: this.monto as number,
      currency: 'PEN',
      deliveryDays: this.plazoDias as number,
      // Vence al final del día elegido, en formato ISO que entiende el backend
      expiresAt: new Date(this.vencimiento + 'T23:59:59').toISOString(),
      conditions: this.condiciones.trim(),
    };

    this.enviando = true;

    this.quoteService.createOffer(this.seleccionada.requestId, datos).subscribe({
      next: () => {
        this.enviando = false;
        this.cerrarDetalle();
        this.mostrarMensajeOferta('Oferta enviada correctamente.', 'exito');
        this.cargarSolicitudes(this.pagina);
        this.cargarConteosOfertas();
      },
      error: (error: HttpErrorResponse) => {
        this.enviando = false;
        this.mostrarMensajeOferta(error.error?.message ?? 'No se pudo enviar la oferta.', 'error');
      },
    });
  }

  // GET /api/v1/seller/offers?status=... (solo el total, para los contadores)
  cargarConteosOfertas(): void {
    forkJoin({
      Enviada: this.quoteService.getSellerOffers('PENDIENTE', 0, 1),
      Aceptada: this.quoteService.getSellerOffers('ACEPTADA', 0, 1),
      Rechazada: this.quoteService.getSellerOffers('RECHAZADA', 0, 1),
    }).subscribe({
      next: (respuesta) => {
        this.conteoOfertas = {
          Enviada: respuesta.Enviada.totalElements ?? 0,
          Aceptada: respuesta.Aceptada.totalElements ?? 0,
          Rechazada: respuesta.Rechazada.totalElements ?? 0,
        };
        this.cdr.markForCheck();
      },
      error: () => {
        this.conteoOfertas = { Enviada: 0, Aceptada: 0, Rechazada: 0 };
      },
    });
  }

  // GET /api/v1/seller/offers?status=... (lista de la pestaña)
  cargarOfertas(estado: string): void {
    const status = this.estadoOferta[estado];
    if (!status) {
      return;
    }

    this.cargandoOfertas = true;
    this.errorOfertas = '';

    this.quoteService.getSellerOffers(status, 0, 50).subscribe({
      next: (respuesta) => {
        this.ofertas = respuesta.content ?? [];
        this.cargandoOfertas = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.ofertas = [];
        this.cargandoOfertas = false;
        this.errorOfertas = error.error?.message ?? 'No se pudieron cargar las ofertas.';
        this.cdr.markForCheck();
      },
    });
  }

  // Cantidad de la pestaña: solicitudes abiertas u ofertas por estado
  contar(estado: string): number {
    if (estado === 'Nueva Solicitud') {
      return this.totalSolicitudes;
    }
    return this.conteoOfertas[estado] ?? 0;
  }

  etiquetaEstadoSolicitud(status?: string): string {
    switch (status) {
      case 'EN_COTIZACION':
        return 'En cotización';
      case 'COTIZADA':
        return 'Con ofertas';
      default:
        return status ?? '';
    }
  }

  claseEstadoSolicitud(status?: string): string {
    return status === 'COTIZADA' ? 'estado_verde' : 'estado_amarillo';
  }

  etiquetaOferta(status?: string): string {
    switch (status) {
      case 'PENDIENTE':
        return 'Enviada';
      case 'ACEPTADA':
        return 'Aceptada';
      case 'RECHAZADA':
        return 'Rechazada';
      default:
        return status ?? '';
    }
  }

  claseOferta(status?: string): string {
    switch (status) {
      case 'ACEPTADA':
        return 'estado_verde';
      case 'RECHAZADA':
        return 'estado_rojo';
      default:
        return 'estado_azul';
    }
  }

  // Color del estado de los movimientos financieros
  claseEstado(estado: string): string {
    if (estado === 'Pendiente' || estado === 'En Tránsito') return 'estado_naranja';
    if (estado === 'Rechazada') return 'estado_rojo';
    return 'estado_verde';
  }

  private limpiarFormulario(): void {
    this.monto = null;
    this.plazoDias = null;
    this.vencimiento = '';
    this.condiciones = '';
  }

  private mostrarMensajeOferta(texto: string, tipo: 'exito' | 'error'): void {
    this.mensajeOferta = texto;
    this.tipoMensajeOferta = tipo;
    this.cdr.markForCheck();
  }

  private formatearFecha(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
