import { Routes } from '@angular/router';
import { InicioSesion } from './componentes/inicio-sesion/inicio-sesion';
import { Carrito } from './componentes/carrito/carrito';
import { EmpiezaACrear } from './componentes/empieza-acrear/empieza-acrear';
import { Catalogo } from './componentes/catalogo/catalogo';
import { Home1 } from './componentes/home1/home1';
import { PerfilCompradorDatosComponente } from './componentes/perfil-comprador-datos-componente/perfil-comprador-datos-componente';
import { PerfilCompradorPedidosComponente } from './componentes/perfil-comprador-pedidos-componente/perfil-comprador-pedidos-componente';
import { PerfilCompradorCotizacionesComponente } from './componentes/perfil-comprador-cotizaciones-componente/perfil-comprador-cotizaciones-componente';
import { PerfilCompradorDireccionComponente } from './componentes/perfil-comprador-direccion-componente/perfil-comprador-direccion-componente';
import { CompradorLayoutComponente } from './componentes/comprador-layout-componente/comprador-layout-componente';
import { PagosComponente } from './componentes/pagos-componente/pagos-componente';
import { VendedorLayoutComponente } from './componentes/vendedor-layout-componente/vendedor-layout-componente';
import { VendedorMisProductos } from './componentes/vendedor-mis-productos/vendedor-mis-productos';
import { VendedorGestorDePedidos } from './componentes/vendedor-gestor-de-pedidos/vendedor-gestor-de-pedidos';
import { VendedorResumen } from './componentes/vendedor-resumen/vendedor-resumen';
import { VendedorMisProductosB } from './componentes/vendedor-mis-productos-b/vendedor-mis-productos-b';
import { authGuard } from './core/auth/auth-guard';
import { DisenosGuardados } from './componentes/disenos-guardados/disenos-guardados';
import { environment } from '../environments/environment';
import { VendedorPerfil } from './componentes/vendedor-perfil/vendedor-perfil';
import { VendedorCotizaciones } from './componentes/vendedor-cotizaciones/vendedor-cotizaciones';
import { GeneralLayoutComponente } from './componentes/general-layout-componente/general-layout-componente';
import { VendedorInicioSesion } from './componentes/vendedor-inicio-sesion/vendedor-inicio-sesion';
import { VendedorRegistro } from './componentes/vendedor-registro/vendedor-registro';

export const routes: Routes = [
  // PANEL DEL VENDEDOR: sin encabezado del comprador
  {
    path: 'vendedor',
    children: [
      {
        path: '',
        redirectTo: 'inicio-sesion',
        pathMatch: 'full'
      },
      {
        path: 'inicio-sesion',
        component: InicioSesion,
        data: {
          modo: 'login',
          tipoCuenta: 'VENDEDOR'
        }
      },
      {
        path: 'registro',
        component: InicioSesion,
        data: {
          modo: 'registro',
          tipoCuenta: 'VENDEDOR'
        }
      }
    ]
  },
  {
    path: 'perfil-vendedor',
    component: VendedorLayoutComponente,
    canActivate: [authGuard],
    data: {
      role: 'VENDEDOR',
      loginUrl: '/vendedor/inicio-sesion'
    },
    children: [
      {
        path: '',
        component: VendedorPerfil,
        pathMatch: 'full'
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
        path: 'cotizaciones',
        component: VendedorCotizaciones,
      },
      {
        path: 'resumen',
        component: VendedorResumen,
      },
    ],
  },

  // SECCIÓN DEL COMPRADOR: con encabezado general
  {
    path: '',
    component: GeneralLayoutComponente,
    children: [
      { path: '', redirectTo: 'home1', pathMatch: 'full' },
      {
        path: 'inicio-sesion',
        component: InicioSesion,
        data: {
          modo: 'login',
          tipoCuenta: 'COMPRADOR'
        }
      },
      {
        path: 'registro',
        component: InicioSesion,
        data: {
          modo: 'registro',
          tipoCuenta: 'COMPRADOR'
        }
      },
      { path: 'empieza-acrear', component: EmpiezaACrear, canActivate: [authGuard], data: { role: 'COMPRADOR' } },
      { path: 'catalogo', component: Catalogo },
      { path: 'home1', component: Home1 },
      {
        path: 'disenos-guardados',
        component: DisenosGuardados,
        // En modo mock (datos internos) no se exige sesión para poder probar la vista
        canActivate: environment.useMockData ? [] : [authGuard],
        data: { role: 'COMPRADOR' },
      },
      {
        path: 'carrito',
        component: Carrito,
        canActivate: [authGuard],
        data: { role: 'COMPRADOR' },
      },
      {
        path: 'pagos',
        component: PagosComponente,
      },
      {
        path: 'perfil-comprador',
        component: CompradorLayoutComponente,
        canActivate: [authGuard],
        data: { role: 'COMPRADOR' },
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
    ],
  },
];
