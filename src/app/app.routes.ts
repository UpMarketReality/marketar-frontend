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
      }
    ]
  },
];
