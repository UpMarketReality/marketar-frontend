import { Routes } from '@angular/router';
import { App } from './app';
import { TestBed } from '@angular/core/testing';
import { Carrito } from './componentes/carrito/carrito';
import { EmpiezaACrear } from './componentes/empieza-acrear/empieza-acrear';
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

export const routes: Routes = [
  { path: '', component: App },
  { path: 'empieza-acrear', component: EmpiezaACrear },
  { path: 'home1', component: Home1 },
  { 
    path: 'carrito', 
    component: Carrito,
    children: [
      {
        path: 'pagos',
        component: PagosComponente,
      },
    ],
  },
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
];
