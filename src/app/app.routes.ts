import { Routes } from '@angular/router';
import {
  PerfilCompradorDatosComponente
} from './componentes/perfil-comprador-datos-componente/perfil-comprador-datos-componente';
import {
  PerfilCompradorPedidosComponente
} from './componentes/perfil-comprador-pedidos-componente/perfil-comprador-pedidos-componente';
import {
  PerfilCompradorCotizacionesComponente
} from './componentes/perfil-comprador-cotizaciones-componente/perfil-comprador-cotizaciones-componente';
import {
  PerfilCompradorDireccionComponente
} from './componentes/perfil-comprador-direccion-componente/perfil-comprador-direccion-componente';
import {CompradorLayoutComponente} from './componentes/comprador-layout-componente/comprador-layout-componente';
import { PagosComponente } from './componentes/pagos-componente/pagos-componente';
import { VendedorLayoutComponente } from './componentes/vendedor-layout-componente/vendedor-layout-componente';
import { VendedorMisProductos } from './componentes/vendedor-mis-productos/vendedor-mis-productos';
import { VendedorGestorDePedidos } from './componentes/vendedor-gestor-de-pedidos/vendedor-gestor-de-pedidos';
import { VendedorResumen } from './componentes/vendedor-resumen/vendedor-resumen';
import { VendedorMisProductosB } from './componentes/vendedor-mis-productos-b/vendedor-mis-productos-b';
import { Catalogo } from './componentes/catalogo/catalogo';

export const routes: Routes = [
  {
    path: 'perfil-comprador',
    component: CompradorLayoutComponente,
    children: [
      {
        path: '',
        redirectTo: 'datos',
        pathMatch: 'full',
      },
      {
        path: 'datos',
        component: PerfilCompradorDatosComponente,
      },
      {
        path: 'direccion',
        component: PerfilCompradorDireccionComponente,
      },
      {
        path: 'pedidos',
        component: PerfilCompradorPedidosComponente,
      },
      {
        path: 'cotizacion',
        component: PerfilCompradorCotizacionesComponente,
      },
    ],
  },
  {
    path: 'carrito',
    component: PagosComponente, //cambiar por componente del carrito
    children: [
      {
        path: 'pagos',
        component: PagosComponente,
      },
    ],
  },
  {
    path: 'perfil-vendedor',
    component: VendedorLayoutComponente,
    children: [
      {
        path: '',
        redirectTo: 'productos',
        pathMatch: 'full',
      },
      {
        path: 'productos',
        component: VendedorMisProductos,
      },
      {
        path: 'nuevo-producto',
        component: VendedorMisProductosB,
      },
      {
        path: 'gestor-pedidos',
        component: VendedorGestorDePedidos,
      },
      {
        path: 'resumen',
        component: VendedorResumen,
      },
    ],
  },
  {
    path: 'catalogo', component: Catalogo,
  }
];
