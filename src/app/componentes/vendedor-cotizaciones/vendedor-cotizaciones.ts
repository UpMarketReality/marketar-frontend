import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCard } from '@angular/material/card';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { ReportService } from '../../services/report-service';
import { SalesReportDTO } from '../../model/sales-report-dto';

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
    MatTabNavPanel,
  ],
  selector: 'app-vendedor-cotizaciones',
  styleUrl: './vendedor-cotizaciones.css',
  templateUrl: './vendedor-cotizaciones.html',
})
export class VendedorCotizaciones {
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

  // Estos datos cambian: llegarán desde la capa de servicio
  cotizaciones: Cotizacion[] = [];
  movimientos: Movimiento[] = [];

  // Estructura fija
  readonly pestanas: Pestana[] = [
    { estado: 'Nueva Solicitud', etiqueta: 'Nuevas Solicitudes', titulo: 'Nuevas Solicitudes' },
    { estado: 'Enviada', etiqueta: 'Enviadas', titulo: 'Cotizaciones Enviadas' },
    { estado: 'Aceptada', etiqueta: 'Aceptadas', titulo: 'Cotizaciones Aceptadas' },
    { estado: 'Rechazada', etiqueta: 'Rechazadas', titulo: 'Cotizaciones Rechazadas' },
  ];

  readonly columnasCotizaciones = ['id', 'cliente', 'proyecto', 'fecha', 'estado'];
  readonly columnasMovimientos = ['fecha', 'concepto', 'referencia', 'monto', 'estado'];

  constructor(private reportService: ReportService) {}

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

  // Solicitudes de la pestaña activa
  get cotizacionesFiltradas(): Cotizacion[] {
    return this.cotizaciones.filter((c) => c.estado === this.pestanaCotizacion);
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
      next: (respuesta) => (this.ventas = respuesta),
      error: (error: HttpErrorResponse) => {
        this.ventas = null;
        this.errorMessage =
          error.error?.message ?? 'No se pudo cargar el reporte. Inténtalo nuevamente.';
      },
    });
  }

  contar(estado: string): number {
    return this.cotizaciones.filter((c) => c.estado === estado).length;
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
}
