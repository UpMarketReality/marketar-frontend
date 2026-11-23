import { Component } from '@angular/core';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCard } from '@angular/material/card';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

type EstadoPedido = 'planos' | 'fabricacion' | 'enviado';

interface Pedido {
  id: string;
  cliente: string;
  mueble: string;
  estado: EstadoPedido;
  // Índice de la etapa actual dentro de etapasFabricacion
  etapaActual: number;
  fecha: string;
  precio: string;
  cantidad: number;
  telefono: string;
  direccion: string;
}

interface Pestana {
  valor: string;
  etiqueta: string;
}

@Component({
  imports: [
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
export class VendedorGestorDePedidos {
  // Estos datos cambian: llegarán desde la capa de servicio
  pedidos: Pedido[] = [];
  pedidoSeleccionado: Pedido | null = null;

  // Pestaña activa: todos, pendientes, fabricacion o completados
  filtroActivo = 'todos';

  // Estructura fija
  readonly pestanas: Pestana[] = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'pendientes', etiqueta: 'Pendientes' },
    { valor: 'fabricacion', etiqueta: 'En Fabricación' },
    { valor: 'completados', etiqueta: 'Completados' },
  ];

  readonly etapasFabricacion: string[] = [
    'Pedido y Pago Recibido',
    'Planos 3D Aprobados',
    'En Fabricación (Corte y Armado)',
    'Control de Calidad / Acabados',
    'Listo para Envío',
  ];

  readonly columnas = ['id', 'cliente', 'mueble', 'estado'];

  private readonly etiquetasEstado: Record<EstadoPedido, string> = {
    planos: 'Aprobación Planos',
    fabricacion: 'En Fabricación',
    enviado: 'Enviado',
  };

  // Pedidos de la pestaña activa
  get pedidosFiltrados(): Pedido[] {
    return this.pedidos.filter((p) => this.coincide(p, this.filtroActivo));
  }

  // Mensaje que se muestra cuando la pestaña no tiene pedidos
  get mensajeVacio(): string {
    if (this.filtroActivo === 'pendientes') {
      return 'No hay pedidos pendientes de aprobación de planos.';
    }
    if (this.filtroActivo === 'fabricacion') {
      return 'No hay pedidos en fabricación.';
    }
    if (this.filtroActivo === 'completados') {
      return 'No hay pedidos completados.';
    }
    return 'Aún no tienes pedidos.';
  }

  contar(filtro: string): number {
    return this.pedidos.filter((p) => this.coincide(p, filtro)).length;
  }

  private coincide(pedido: Pedido, filtro: string): boolean {
    if (filtro === 'pendientes') return pedido.estado === 'planos';
    if (filtro === 'fabricacion') return pedido.estado === 'fabricacion';
    if (filtro === 'completados') return pedido.estado === 'enviado';
    return true;
  }

  etiquetaEstado(estado: EstadoPedido): string {
    return this.etiquetasEstado[estado];
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
