import { Component } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
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
    MatCard,
    MatCardContent,
    MatIcon,
    MatButton,
    MatTableModule
  ],
  selector: 'app-vendedor-resumen',
  styleUrl: './vendedor-resumen.css',
  templateUrl: './vendedor-resumen.html',
})
export class VendedorResumen {
  // Solo la estructura de la vista (etiquetas, iconos, colores).
  // Los valores llegarán desde la capa de servicio.
  readonly estadisticas: Estadistica[] = [
    { etiqueta: 'Ingresos del mes', icono: 'payments', tono: 'teal' },
    { etiqueta: 'En fabricación', icono: 'construction', tono: 'naranja' },
    { etiqueta: 'Cotizaciones pendientes', icono: 'forum', tono: 'azul' },
    { etiqueta: 'Calificación promedio', icono: 'star', tono: 'morado' }
  ];

  readonly pedidos: Pedido[] = [];

  readonly liquidacion: LineaLiquidacion[] = [
    { etiqueta: 'Ventas brutas' },
    { etiqueta: 'Comisión MarketAR', negativo: true },
    { etiqueta: 'Ajustes / Reembolsos' }
  ];

  totalDepositar?: string;

  readonly columnas = ['id', 'mueble', 'entrega', 'estado', 'acciones'];

  private readonly etiquetasEstado: Record<EstadoPedido, string> = {
    fabricacion: 'En Fabricación',
    enviado: 'Enviado',
    planos: 'Aprobación Planos'
  };

  etiquetaEstado(estado: EstadoPedido): string {
    return this.etiquetasEstado[estado];
  }
}
