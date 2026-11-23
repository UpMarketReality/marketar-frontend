import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ReportService } from '../../services/report-service';
import { SalesReportDTO } from '../../model/sales-report-dto';
import { OffersReportDTO } from '../../model/offers-report-dto';

type EstadoPedido = 'fabricacion' | 'enviado' | 'planos';
type TonoEstadistica = 'teal' | 'naranja' | 'azul' | 'morado';

interface Estadistica {
  etiqueta: string;
  valor: string;
  icono: string;
  tono: TonoEstadistica;
}

interface Pedido {
  id: string;
  mueble: string;
  entrega: string;
  estado: EstadoPedido;
}

interface LineaLiquidacion {
  etiqueta: string;
  valor?: string;
  negativo?: boolean;
}

@Component({
  imports: [
    FormsModule,
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatInput,
    MatIcon,
    MatButton,
    MatTableModule,
  ],
  selector: 'app-vendedor-resumen',
  styleUrl: './vendedor-resumen.css',
  templateUrl: './vendedor-resumen.html',
})
export class VendedorResumen {
  // FILTRO DE FECHAS DEL REPORTE (formato YYYY-MM-DD)
  fechaInicio = '';
  fechaFin = '';

  // Datos que llegan de la API (null hasta elegir un período válido)
  ventas: SalesReportDTO | null = null;
  ofertas: OffersReportDTO | null = null;
  errorMessage = '';

  readonly pedidos: Pedido[] = [];

  readonly liquidacion: LineaLiquidacion[] = [
    { etiqueta: 'Ventas brutas' },
    { etiqueta: 'Comisión MarketAR', negativo: true },
    { etiqueta: 'Ajustes / Reembolsos' },
  ];

  totalDepositar?: string;

  readonly columnas = ['id', 'mueble', 'entrega', 'estado', 'acciones'];

  private readonly etiquetasEstado: Record<EstadoPedido, string> = {
    fabricacion: 'En Fabricación',
    enviado: 'Enviado',
    planos: 'Aprobación Planos',
  };

  constructor(private reportService: ReportService) {}

  // Tarjetas del resumen con los valores del período elegido
  get estadisticas(): Estadistica[] {
    return [
      {
        etiqueta: 'Ventas del período',
        valor: this.montoSoles(this.ventas?.netSalesAmount),
        icono: 'payments',
        tono: 'teal',
      },
      {
        etiqueta: 'Compras de catálogo',
        valor: this.numero(this.ventas?.purchaseCount),
        icono: 'shopping_bag',
        tono: 'azul',
      },
      {
        etiqueta: 'Ofertas emitidas',
        valor: this.numero(this.ofertas?.offersIssued),
        icono: 'forum',
        tono: 'naranja',
      },
      {
        etiqueta: 'Encargos confirmados',
        valor: this.numero(this.ofertas?.ordersConfirmed),
        icono: 'handshake',
        tono: 'morado',
      },
    ];
  }

  // Verdadero si el inicio es posterior al fin
  get rangoInvalido(): boolean {
    return !!this.fechaInicio && !!this.fechaFin && this.fechaInicio > this.fechaFin;
  }

  // Se llama cada vez que cambia una fecha
  alCambiarPeriodo(): void {
    this.errorMessage = '';

    // Sin período completo y válido no se consulta la API
    if (!this.fechaInicio || !this.fechaFin || this.rangoInvalido) {
      this.ventas = null;
      this.ofertas = null;
      return;
    }

    this.reportService.getSales(this.fechaInicio, this.fechaFin).subscribe({
      next: (respuesta) => (this.ventas = respuesta),
      error: (error: HttpErrorResponse) => this.mostrarError(error),
    });

    this.reportService.getOffers(this.fechaInicio, this.fechaFin).subscribe({
      next: (respuesta) => (this.ofertas = respuesta),
      error: (error: HttpErrorResponse) => this.mostrarError(error),
    });
  }

  etiquetaEstado(estado: EstadoPedido): string {
    return this.etiquetasEstado[estado];
  }

  private mostrarError(error: HttpErrorResponse): void {
    this.ventas = null;
    this.ofertas = null;
    this.errorMessage =
      error.error?.message ?? 'No se pudo cargar el reporte. Inténtalo nuevamente.';
  }

  private numero(valor?: number): string {
    return valor === undefined ? '—' : valor.toString();
  }

  private montoSoles(valor?: number): string {
    if (valor === undefined) return '—';
    return (
      'S/ ' + valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }
}
