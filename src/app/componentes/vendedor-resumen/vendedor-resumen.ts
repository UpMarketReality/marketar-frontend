import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

type EstadoPedido = 'fabricacion' | 'enviado' | 'planos';
type TonoEstadistica = 'teal' | 'naranja' | 'azul' | 'morado';

interface Estadistica {
  etiqueta: string;
  valor?: string;
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

  // Solo la estructura de la vista (etiquetas, iconos, colores).
  // Los valores llegarán desde la capa de servicio.
  readonly estadisticas: Estadistica[] = [
    { etiqueta: 'Ingresos del mes', icono: 'payments', tono: 'teal' },
    { etiqueta: 'En fabricación', icono: 'construction', tono: 'naranja' },
    { etiqueta: 'Cotizaciones pendientes', icono: 'forum', tono: 'azul' },
    { etiqueta: 'Calificación promedio', icono: 'star', tono: 'morado' },
  ];

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

  // Verdadero si el inicio es posterior al fin
  get rangoInvalido(): boolean {
    return !!this.fechaInicio && !!this.fechaFin && this.fechaInicio > this.fechaFin;
  }

  etiquetaEstado(estado: EstadoPedido): string {
    return this.etiquetasEstado[estado];
  }
}
