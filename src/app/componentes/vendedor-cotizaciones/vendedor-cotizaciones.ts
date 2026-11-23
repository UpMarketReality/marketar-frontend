import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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

interface Cotizacion {
  id: string;
  cliente: string;
  proyecto: string;
  fecha: string;
  estado: string;
}

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

  // Solo las pestañas Enviadas, Aceptadas y Rechazadas usan estos datos (aún sin endpoint)
  cotizaciones: Cotizacion[] = [];
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
    { estado: 'Enviada', etiqueta: 'Enviadas', titulo: 'Cotizaciones Enviadas' },
    { estado: 'Aceptada', etiqueta: 'Aceptadas', titulo: 'Cotizaciones Aceptadas' },
    { estado: 'Rechazada', etiqueta: 'Rechazadas', titulo: 'Cotizaciones Rechazadas' },
  ];

  readonly columnasSolicitudes = ['id', 'proyecto', 'cantidad', 'ofertas', 'fecha', 'estado'];
  readonly columnasCotizaciones = ['id', 'cliente', 'proyecto', 'fecha', 'estado'];
  readonly columnasMovimientos = ['fecha', 'concepto', 'referencia', 'monto', 'estado'];

  ngOnInit(): void {
    this.catalogService.getProductCategories().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cdr.markForCheck();
      },
      error: () => {
        this.categorias = [];
      },
    });

    // Se carga al entrar para mostrar el contador de la pestaña
    this.cargarSolicitudes(0);
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

  // Solicitudes de la pestaña activa (solo para las pestañas sin API)
  get cotizacionesFiltradas(): Cotizacion[] {
    return this.cotizaciones.filter((c) => c.estado === this.pestanaCotizacion);
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
      },
      error: (error: HttpErrorResponse) => {
        this.enviando = false;
        this.mostrarMensajeOferta(error.error?.message ?? 'No se pudo enviar la oferta.', 'error');
      },
    });
  }

  // Cantidad de la pestaña: solicitudes con API, o filas locales para el resto
  contar(estado: string): number {
    if (estado === 'Nueva Solicitud') {
      return this.totalSolicitudes;
    }
    return this.cotizaciones.filter((c) => c.estado === estado).length;
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

  // Color del estado: amarillo, azul, verde, rojo o naranja
  claseEstado(estado: string): string {
    if (estado === 'Nueva Solicitud') return 'estado_amarillo';
    if (estado === 'Enviada') return 'estado_azul';
    if (estado === 'Rechazada') return 'estado_rojo';
    if (estado === 'Pendiente' || estado === 'En Tránsito') return 'estado_naranja';
    return 'estado_verde';
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join('')
      .toUpperCase();
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
