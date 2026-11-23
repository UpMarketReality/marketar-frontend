import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardTitle } from '@angular/material/card';
import { CatalogService } from '../../services/catalog-service';
import { CategoryDTO } from '../../model/category-dto';

@Component({
  imports: [
    FormsModule,
    RouterLink,
    RouterLinkActive,
    MatTabNav,
    MatTabLink,
    MatTabNavPanel,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    MatIcon,
    MatButton,
    MatCard,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
  ],
  selector: 'app-vendedor-mis-productos-b',
  styleUrl: './vendedor-mis-productos-b.css',
  templateUrl: './vendedor-mis-productos-b.html',
})
export class VendedorMisProductosB implements OnInit, OnDestroy {
  private readonly catalogService = inject(CatalogService);

  // LÍMITES DEL BACKEND (US08)
  private readonly maxImagenes = 10;
  private readonly maxBytes = 5 * 1024 * 1024;
  private readonly tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

  // Categorías que llegan de la API
  categorias: CategoryDTO[] = [];

  // Datos del formulario
  nombre = '';
  descripcion = '';
  categoriaId: number | null = null;
  material = '';
  dimensiones = '';
  color = '';
  precio: number | null = null;
  stock: number | null = null;

  // Imágenes seleccionadas y su vista previa
  imagenes: File[] = [];
  previews: string[] = [];

  // Mensajes de la pantalla
  errorImagenes = '';
  errorMessage = '';

  ngOnInit(): void {
    this.catalogService.getProductCategories().subscribe({
      next: (categorias) => (this.categorias = categorias),
      error: () => (this.errorMessage = 'No se pudieron cargar las categorías.'),
    });
  }

  ngOnDestroy(): void {
    this.previews.forEach((url) => URL.revokeObjectURL(url));
  }

  // Campos obligatorios y límites iguales a ProductRequest del backend
  get formularioValido(): boolean {
    return (
      this.nombre.trim().length > 0 &&
      this.nombre.length <= 150 &&
      this.categoriaId !== null &&
      this.material.trim().length > 0 &&
      this.material.length <= 100 &&
      this.dimensiones.trim().length > 0 &&
      this.dimensiones.length <= 150 &&
      this.color.trim().length > 0 &&
      this.color.length <= 50 &&
      this.precio !== null &&
      this.precio > 0 &&
      this.stock !== null &&
      this.stock >= 0 &&
      this.descripcion.length <= 1000 &&
      this.imagenes.length > 0
    );
  }

  // Se llama al elegir archivos en el selector
  seleccionarImagenes(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);
    this.errorImagenes = '';

    for (const archivo of archivos) {
      if (this.imagenes.length >= this.maxImagenes) {
        this.errorImagenes = 'Puedes subir máximo 10 imágenes.';
        break;
      }
      if (!this.tiposPermitidos.includes(archivo.type)) {
        this.errorImagenes = 'Solo se permiten archivos JPG, PNG o WebP.';
        continue;
      }
      if (archivo.size > this.maxBytes) {
        this.errorImagenes = 'Cada imagen debe pesar máximo 5 MB.';
        continue;
      }
      this.imagenes.push(archivo);
      this.previews.push(URL.createObjectURL(archivo));
    }

    // Permite volver a elegir el mismo archivo más adelante
    input.value = '';
  }

  quitarImagen(indice: number): void {
    URL.revokeObjectURL(this.previews[indice]);
    this.imagenes.splice(indice, 1);
    this.previews.splice(indice, 1);
    this.errorImagenes = '';
  }

  publicar(): void {
    this.errorMessage = '';

    if (!this.formularioValido) {
      this.errorMessage = 'Completa los campos obligatorios y agrega al menos una imagen.';
      return;
    }


  }
}
