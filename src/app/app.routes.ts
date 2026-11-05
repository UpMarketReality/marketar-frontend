
import { Routes } from '@angular/router';

// COMPONENTES GENERALES
import { InicioSesion } from './componentes/inicio-sesion/inicio-sesion';
import { Carrito } from './componentes/carrito/carrito';
import { EmpiezaACrear } from './componentes/empieza-acrear/empieza-acrear';
import { Home1 } from './componentes/home1/home1';

// COMPONENTES DEL COMPRADOR
import { PerfilCompradorDatosComponente } from './componentes/perfil-comprador-datos-componente/perfil-comprador-datos-componente';
import { PerfilCompradorPedidosComponente } from './componentes/perfil-comprador-pedidos-componente/perfil-comprador-pedidos-componente';
import { PerfilCompradorCotizacionesComponente } from './componentes/perfil-comprador-cotizaciones-componente/perfil-comprador-cotizaciones-componente';
import { PerfilCompradorDireccionComponente } from './componentes/perfil-comprador-direccion-componente/perfil-comprador-direccion-componente';
import { CompradorLayoutComponente } from './componentes/comprador-layout-componente/comprador-layout-componente';
import { PagosComponente } from './componentes/pagos-componente/pagos-componente';

// COMPONENTES DEL VENDEDOR
import { VendedorLayoutComponente } from './componentes/vendedor-layout-componente/vendedor-layout-componente';
import { VendedorMisProductos } from './componentes/vendedor-mis-productos/vendedor-mis-productos';
import { VendedorGestorDePedidos } from './componentes/vendedor-gestor-de-pedidos/vendedor-gestor-de-pedidos';
import { VendedorResumen } from './componentes/vendedor-resumen/vendedor-resumen';
import { VendedorMisProductosB } from './componentes/vendedor-mis-productos-b/vendedor-mis-productos-b';

// MAR-12: COTIZACIONES Y FINANZAS DEL VENDEDOR
import { VendedorCotizaciones } from './componentes/vendedor-cotizaciones/vendedor-cotizaciones';

export const routes: Routes = [

  // RUTA INICIAL
  {
    path: '',
    redirectTo: 'home1',
    pathMatch: 'full'
  },

  // RUTAS GENERALES
  {
    path: 'inicio-sesion',
    component: InicioSesion
  },
  {
    path: 'empieza-acrear',
    component: EmpiezaACrear
  },
  {
    path: 'home1',
    component: Home1
  },

  // CARRITO Y PAGOS
  {
    path: 'carrito',
    component: Carrito,
    children: [
      {
        path: 'pagos',
        component: PagosComponente
      }
    ]
  },

  // PERFIL DEL COMPRADOR
  {
    path: 'perfil-comprador',
    component: CompradorLayoutComponente,
    children: [
      {
        path: '',
        redirectTo: 'datos',
        pathMatch: 'full'
      },
      {
        path: 'datos',
        component: PerfilCompradorDatosComponente
      },
      {
        path: 'direccion',
        component: PerfilCompradorDireccionComponente
      },
      {
        path: 'pedidos',
        component: PerfilCompradorPedidosComponente
      },
      {
        path: 'cotizacion',
        component: PerfilCompradorCotizacionesComponente
      }
    ]
  },

  // PERFIL DEL VENDEDOR
  {
    path: 'perfil-vendedor',
    component: VendedorLayoutComponente,
    children: [

      // REDIRECCION INICIAL
      {
        path: '',
        redirectTo: 'productos',
        pathMatch: 'full'
      },

      // MIS PRODUCTOS
      {
        path: 'productos',
        component: VendedorMisProductos
      },

      // AGREGAR NUEVO PRODUCTO
      {
        path: 'nuevo-producto',
        component: VendedorMisProductosB
      },

      // GESTOR DE PEDIDOS
      {
        path: 'gestor-pedidos',
        component: VendedorGestorDePedidos
      },

      // RESUMEN GENERAL
      {
        path: 'resumen',
        component: VendedorResumen
      },

      // MAR-12: COTIZACIONES Y FINANZAS
      {
        path: 'cotizaciones',
        component: VendedorCotizaciones
      }

    ]
  }

];
