import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, switchMap } from 'rxjs';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { CatalogService } from '../../services/catalog-service';
import { CategoryDTO } from '../../model/category-dto';
import { ImageDTO } from '../../model/image-dto';
import { ProductDTO } from '../../model/product-dto';
import { ProductRequest } from '../../model/product-request';

@Component({
  imports: [
    FormsModule,
    RouterLink,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    MatIcon,
    MatButton,
    MatSlideToggle,
    MatCard,
    MatCardContent,
    MatCardActions,
  ],
  selector: 'app-vendedor-editar-producto',
  templateUrl: './vendedor-editar-producto.html',
  styleUrl: './vendedor-editar-producto.css',
})
export class VendedorEditarProducto implements OnInit, OnDestroy {
  private readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // PRODUCTO QUE SE EDITA (viene de /perfil-vendedor/productos/:id/editar)
  readonly productId = Number(this.route.snapshot.paramMap.get('id'));

  // LIMITES DEL BACKEND
  readonly maximoImagenes = 10;
  private readonly maximoBytes = 5 * 1024 * 1024;
  private readonly tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maximoPrecio = 99999999.99;

  // CATEGORIAS DE LA API
  categorias: CategoryDTO[] = [];

  // DATOS DEL FORMULARIO
  nombre = '';
  descripcion = '';
  categoriaId: number | null = null;
  precio: number | null = null;
  precioMayor: number | null = null;
  stock: number | null = null;
  material = '';
  color = '';
  dimensiones = '';

  // ESTADO ACTIVO (ACTIVO o INACTIVO)
  activo = true;
  private estadoOriginal = true;

  // IMAGENES
  imagenesActuales: ImageDTO[] = [];
  private imagenesQuitadas: number[] = [];
  nuevasImagenes: File[] = [];
  previews: string[] = [];

  // ESTADO DE LA PANTALLA
  cargando = true;
  guardando = false;
  mensaje = '';
  tipoMensaje: 'exito' | 'error' = 'exito';
  errorImagenes = '';

  ngOnInit(): void {
    // Carga categorías y producto al mismo tiempo
    forkJoin({
      categorias: this.catalogService.getProductCategories(),
      producto: this.catalogService.getOwnProduct(this.productId),
    }).subscribe({
      next: ({ categorias, producto }) => {
        this.categorias = categorias;
        this.cargarFormulario(producto);
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.mostrarError(error.error?.message ?? 'No se pudo cargar el producto.');
      },
    });
  }

  ngOnDestroy(): void {
    this.previews.forEach((url) => URL.revokeObjectURL(url));
  }

  private cargarFormulario(producto: ProductDTO): void {
    this.nombre = producto.name ?? '';
    this.descripcion = producto.description ?? '';
    this.categoriaId = producto.categoryId ?? null;
    this.precio = producto.price ?? null;
    this.precioMayor = producto.wholesalePrice ?? null;
    this.stock = producto.stock ?? null;
    this.material = producto.material ?? '';
    this.color = producto.color ?? '';
    this.dimensiones = producto.dimensions ?? '';
    this.activo = producto.status !== 'INACTIVO';
    this.estadoOriginal = this.activo;
    this.imagenesActuales = producto.images ?? [];
  }

  idImagen(imagen: ImageDTO): number {
    return imagen.imageId ?? 0;
  }

  get totalImagenes(): number {
    const conservadas = this.imagenesActuales.filter(
      (imagen) => !this.estaQuitada(this.idImagen(imagen)),
    ).length;

    return conservadas + this.nuevasImagenes.length;
  }

  estaQuitada(imagenId: number): boolean {
    return this.imagenesQuitadas.includes(imagenId);
  }

  alternarImagenActual(imagenId: number): void {
    if (this.estaQuitada(imagenId)) {
      this.imagenesQuitadas = this.imagenesQuitadas.filter((id) => id !== imagenId);
    } else {
      this.imagenesQuitadas = [...this.imagenesQuitadas, imagenId];
    }
  }

  seleccionarImagenes(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);
    this.errorImagenes = '';

    for (const archivo of archivos) {
      if (this.totalImagenes >= this.maximoImagenes) {
        this.errorImagenes = `Puedes tener máximo ${this.maximoImagenes} imágenes.`;
        break;
      }
      if (!this.tiposPermitidos.includes(archivo.type)) {
        this.errorImagenes = 'Solo se permiten archivos JPG, PNG o WebP.';
        continue;
      }
      if (archivo.size > this.maximoBytes) {
        this.errorImagenes = 'Cada imagen debe pesar máximo 5 MB.';
        continue;
      }
      this.nuevasImagenes.push(archivo);
      this.previews.push(URL.createObjectURL(archivo));
    }

    input.value = '';
  }

  quitarNueva(indice: number): void {
    URL.revokeObjectURL(this.previews[indice]);
    this.previews.splice(indice, 1);
    this.nuevasImagenes.splice(indice, 1);
    this.errorImagenes = '';
  }

  // Mismas reglas que ProductRequest del backend
  private validar(): string | null {
    if (!this.nombre.trim() || this.nombre.trim().length > 150) {
      return 'Ingresa el nombre del producto (máximo 150 caracteres).';
    }
    if (this.descripcion.length > 1000) {
      return 'La descripción no debe superar 1000 caracteres.';
    }
    if (this.categoriaId === null) {
      return 'Selecciona una categoría.';
    }
    if (this.precio === null || this.precio <= 0 || this.precio > this.maximoPrecio) {
      return 'Ingresa un precio de venta mayor a 0.';
    }
    if (
      this.precioMayor !== null &&
      (this.precioMayor <= 0 || this.precioMayor > this.maximoPrecio)
    ) {
      return 'El precio por mayor debe ser mayor a 0.';
    }
    if (this.stock === null || this.stock < 0 || !Number.isInteger(this.stock)) {
      return 'El stock debe ser un número entero mayor o igual a 0.';
    }
    if (!this.material.trim() || this.material.trim().length > 100) {
      return 'Ingresa el material (máximo 100 caracteres).';
    }
    if (!this.color.trim() || this.color.trim().length > 50) {
      return 'Ingresa el color (máximo 50 caracteres).';
    }
    if (!this.dimensiones.trim() || this.dimensiones.trim().length > 150) {
      return 'Ingresa las dimensiones (máximo 150 caracteres).';
    }
    if (this.totalImagenes < 1) {
      return 'El producto necesita al menos una imagen.';
    }
    return null;
  }

  // PUT /api/v1/seller/products/{id} y, si cambió, PATCH /status
  guardar(): void {
    if (this.cargando || this.guardando) return;

    this.mensaje = '';
    const error = this.validar();

    if (error) {
      this.mostrarError(error);
      return;
    }

    const datos = new ProductRequest();
    datos.name = this.nombre.trim();
    datos.description = this.descripcion.trim();
    datos.categoryId = this.categoriaId as number;
    datos.unitPrice = this.precio as number;
    datos.wholesalePrice = this.precioMayor;
    datos.dimensions = this.dimensiones.trim();
    datos.material = this.material.trim();
    datos.color = this.color.trim();
    datos.stock = this.stock as number;
    datos.retainedImageIds = this.imagenesActuales
      .map((imagen) => this.idImagen(imagen))
      .filter((id) => !this.estaQuitada(id));

    this.guardando = true;

    this.catalogService
      .updateProduct(this.productId, datos, this.nuevasImagenes)
      .pipe(
        switchMap(() =>
          this.activo !== this.estadoOriginal
            ? this.catalogService.changeStatus(this.productId, this.activo)
            : of(null),
        ),
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/perfil-vendedor/productos');
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.mostrarError(error.error?.message ?? 'No se pudo guardar el producto.');
        },
      });
  }

  private mostrarError(texto: string): void {
    this.tipoMensaje = 'error';
    this.mensaje = texto;
    this.cdr.markForCheck();
  }
}
