import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ProductDTO } from '../../model/product-dto';
import { ImageDTO } from '../../model/image-dto';
import { CatalogService } from '../../services/catalog-service';
import { RecentlyViewedService } from '../../services/recently-viewed-service';
import { environment } from '../../../environments/environment';
import { CommerceService } from '../../services/commerce-service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-detalle-productos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './detalle-productos.html',
  styleUrls: ['./detalle-productos.css'],
})
export class DetalleProductos implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly commerceService = inject(CommerceService);
  private readonly authService = inject(AuthService);

  agregandoCarrito = false;
  private readonly recentlyViewed = inject(RecentlyViewedService);
  private readonly snackBar = inject(MatSnackBar);
  // La app no usa zone.js: hay que avisar a Angular cuando llegan datos asíncronos
  private readonly cdr = inject(ChangeDetectorRef);

  // El backend devuelve las imágenes como rutas relativas (/media/products/...),
  // por eso se les antepone el origen del backend (http://localhost:8080).
  private readonly backendOrigin = new URL(environment.apiUrl).origin;
  readonly placeholderImage = 'assets/placeholder-mueble.svg';

  product: ProductDTO | null = null;
  loading = true;
  errorMessage = '';

  selectedImageUrl = '';
  quantity = 1;

  ngOnInit(): void {
    // Se escucha el parámetro para recargar si se navega de un producto a otro
    this.route.paramMap.subscribe((params) => {
      const productId = Number(params.get('productId'));
      if (!Number.isInteger(productId) || productId <= 0) {
        this.loading = false;
        this.errorMessage = 'El producto solicitado no es válido.';
        this.cdr.markForCheck();
        return;
      }
      this.loadProduct(productId);
    });
  }

  // GET /api/v1/products/{productId}
  loadProduct(productId: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.quantity = 1;

    this.catalogService.getPublicProductById(productId).subscribe({
      next: (data: ProductDTO) => {
        this.product = data;

        const principalImg = data.images?.find((img) => img.principal);
        this.selectedImageUrl = this.resolveImage(
          principalImg?.url || data.mainImageUrl || data.images?.[0]?.url,
        );

        this.recentlyViewed.add(data);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al obtener el producto:', err);
        this.product = null;
        this.errorMessage =
          err?.status === 404
            ? 'El producto no existe o ya no está disponible.'
            : 'No se pudo cargar el detalle del producto.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  retry(): void {
    const productId = Number(this.route.snapshot.paramMap.get('productId'));
    if (productId > 0) this.loadProduct(productId);
  }

  // ---------- Imágenes ----------

  resolveImage(url?: string): string {
    if (!url) return this.placeholderImage;
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
    return url.startsWith('/') ? `${this.backendOrigin}${url}` : url;
  }

  selectImage(image: ImageDTO): void {
    this.selectedImageUrl = this.resolveImage(image.url);
  }

  isSelected(image: ImageDTO): boolean {
    return this.selectedImageUrl === this.resolveImage(image.url);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith(this.placeholderImage)) img.src = this.placeholderImage;
  }

  // ---------- Datos de la vista ----------

  get stock(): number {
    return this.product?.stock ?? 0;
  }

  get hasWholesaleDiscount(): boolean {
    const p = this.product;
    return !!p?.wholesalePrice && !!p.price && p.wholesalePrice < p.price;
  }

  getStoreInitials(storeName: string | undefined): string {
    if (!storeName) return 'MA';
    return storeName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  // ---------- Cantidad ----------

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQuantity(): void {
    if (this.quantity < this.stock) {
      this.quantity++;
    } else {
      this.snackBar.open(`Solo hay ${this.stock} unidades disponibles`, 'Cerrar', {
        duration: 2500,
      });
    }
  }

  // ---------- Acciones ----------

  addToCart(): void {
    if (
      !this.product ||
      this.product.productId == null ||
      this.stock <= 0 ||
      this.agregandoCarrito
    ) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/inicio-sesion'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    if (!this.authService.hasRole('COMPRADOR')) {
      this.snackBar.open('Solo los compradores pueden agregar productos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.agregandoCarrito = true;

    this.commerceService.addItem(this.product.productId, this.quantity).subscribe({
      next: () => {
        this.agregandoCarrito = false;
        this.cdr.markForCheck();

        this.snackBar
          .open('Producto agregado al carrito correctamente', 'Ver carrito', { duration: 3500 })
          .onAction()
          .subscribe(() => {
            this.router.navigate(['/carrito']);
          });
      },

      error: (error) => {
        this.agregandoCarrito = false;
        this.cdr.markForCheck();

        this.snackBar.open(
          error.error?.message ?? 'No se pudo agregar el producto al carrito',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }

  openARViewer(): void {
    // Punto de integración para el visor de realidad aumentada
    this.snackBar.open('La vista en realidad aumentada estará disponible pronto', 'Cerrar', {
      duration: 3000,
    });
  }
}
