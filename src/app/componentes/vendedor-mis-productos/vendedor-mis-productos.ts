import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatChip, MatChipAvatar } from '@angular/material/chips';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardImage,
  MatCardTitle,
} from '@angular/material/card';
import { CatalogService } from '../../services/catalog-service';
import { ProductDTO } from '../../model/product-dto';

@Component({
  imports: [
    FormsModule,
    DecimalPipe,
    RouterLink,
    RouterLinkActive,
    MatTabNav,
    MatTabLink,
    MatTabNavPanel,
    MatFormField,
    MatPrefix,
    MatInput,
    MatSelect,
    MatOption,
    MatIcon,
    MatButton,
    MatChip,
    MatChipAvatar,
    MatCard,
    MatCardImage,
    MatCardContent,
    MatCardTitle,
    MatCardActions,
  ],
  selector: 'app-vendedor-mis-productos',
  styleUrl: './vendedor-mis-productos.css',
  templateUrl: './vendedor-mis-productos.html',
})
export class VendedorMisProductos implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly cdr = inject(ChangeDetectorRef);

  // PRODUCTOS DE LA PAGINA ACTUAL (vienen de la API)
  productos: ProductDTO[] = [];
  cargando = true;
  errorMessage = '';

  // PRODUCTO CUYO ESTADO SE ESTA CAMBIANDO (evita clics repetidos)
  productoEnCambio: number | null = null;

  // PAGINACION
  pagina = 0;
  readonly tamanoPagina = 12;
  totalPaginas = 0;
  totalProductos = 0;

  // FILTROS (se aplican sobre la página cargada)
  busqueda = '';
  estadoFiltro = 'todos';

  ngOnInit(): void {
    this.cargarProductos(0);
  }

  get productosFiltrados(): ProductDTO[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.productos.filter((producto) => {
      const coincideEstado = this.estadoFiltro === 'todos' || producto.status === this.estadoFiltro;

      const coincideTexto =
        !texto ||
        (producto.name ?? '').toLowerCase().includes(texto) ||
        String(producto.productId ?? '').includes(texto);

      return coincideEstado && coincideTexto;
    });
  }

  // GET /api/v1/seller/products
  cargarProductos(pagina: number): void {
    this.cargando = true;
    this.errorMessage = '';

    this.catalogService.getOwnProducts(pagina, this.tamanoPagina).subscribe({
      next: (respuesta) => {
        this.productos = respuesta.content ?? [];
        this.pagina = respuesta.number ?? pagina;
        this.totalPaginas = respuesta.totalPages ?? 0;
        this.totalProductos = respuesta.totalElements ?? this.productos.length;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.errorMessage = error.error?.message ?? 'No se pudieron cargar tus productos.';
        this.cdr.markForCheck();
      },
    });
  }

  // PATCH /api/v1/seller/products/{id}/status
  // Si está INACTIVO se reactiva; si no, se desactiva
  cambiarEstado(producto: ProductDTO): void {
    if (producto.productId === undefined || this.productoEnCambio !== null) {
      return;
    }

    const activar = producto.status === 'INACTIVO';
    const id = producto.productId;

    this.productoEnCambio = id;
    this.errorMessage = '';

    this.catalogService.changeStatus(id, activar).subscribe({
      next: (actualizado) => {
        // Reemplaza solo la tarjeta cambiada con los datos que devuelve la API
        this.productos = this.productos.map((p) =>
          p.productId === actualizado.productId ? actualizado : p,
        );
        this.productoEnCambio = null;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.productoEnCambio = null;
        this.errorMessage = error.error?.message ?? 'No se pudo cambiar el estado del producto.';
        this.cdr.markForCheck();
      },
    });
  }

  paginaAnterior(): void {
    if (this.pagina > 0) {
      this.cargarProductos(this.pagina - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.pagina < this.totalPaginas - 1) {
      this.cargarProductos(this.pagina + 1);
    }
  }

  etiquetaEstado(status?: string): string {
    switch (status) {
      case 'ACTIVO':
        return 'Activo';
      case 'AGOTADO':
        return 'Agotado';
      case 'INACTIVO':
        return 'Inactivo';
      default:
        return status ?? '';
    }
  }
}
