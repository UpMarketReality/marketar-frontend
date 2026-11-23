import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FavoriteDTO } from '../../model/favorite-dto';
import { ProductDTO } from '../../model/product-dto';
import { CommerceService } from '../../services/commerce-service';
import { CatalogService } from '../../services/catalog-service';
import { CartService } from '../../services/cart-service';
import { RecentlyViewedService } from '../../services/recently-viewed-service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-disenos-guardados',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './disenos-guardados.html',
  styleUrls: ['./disenos-guardados.css'],
})
export class DisenosGuardados implements OnInit {
  private readonly commerceService = inject(CommerceService);
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly recentlyViewedService = inject(RecentlyViewedService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  // La app no usa zone.js: hay que avisar a Angular cuando llegan datos asíncronos
  private readonly cdr = inject(ChangeDetectorRef);

  // El backend devuelve las imágenes como rutas relativas (/media/products/...)
  private readonly backendOrigin = new URL(environment.apiUrl).origin;

  favorites: FavoriteDTO[] = [];
  recentlyViewed: ProductDTO[] = [];
  recommended: ProductDTO[] = [];

  loading = true;
  errorMessage = '';

  readonly previewSize = 4;
  showAllSaved = false;

  private favoriteProductIds = new Set<number>();
  private pendingFavoriteIds = new Set<number>();
  private failedImages = new Set<string>();

  ngOnInit(): void {
    this.recentlyViewed = this.recentlyViewedService.getAll().slice(0, this.previewSize);
    this.loadFavorites();
  }

  // GET /api/v1/users/me/favorites
  loadFavorites(): void {
    this.loading = true;
    this.errorMessage = '';

    this.commerceService.getFavorites().subscribe({
      next: (data: FavoriteDTO[]) => {
        this.favorites = data ?? [];
        this.syncFavoriteIds();
        this.loading = false;
        this.loadRecommendations();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar favoritos:', err);
        this.errorMessage = 'No se pudieron cargar tus diseños guardados.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Recomendados: productos del catálogo (GET /api/v1/products) que no están en favoritos
  // ni en vistos recientemente. Se priorizan las categorías que el usuario ya guardó.
  private loadRecommendations(): void {
    this.catalogService.getProducts(undefined, undefined, undefined, undefined, 0, 20).subscribe({
      next: (page) => {
        const excluded = new Set<number | undefined>([
          ...this.favoriteProductIds,
          ...this.recentlyViewed.map((p) => p.productId),
        ]);
        const likedCategories = new Set(this.allSavedProducts.map((p) => p.categoryId));

        this.recommended = (page?.content ?? [])
          .filter((p) => !excluded.has(p.productId))
          .sort(
            (a, b) =>
              Number(likedCategories.has(b.categoryId)) - Number(likedCategories.has(a.categoryId)) ||
              (b.productId ?? 0) - (a.productId ?? 0),
          )
          .slice(0, this.previewSize);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar recomendados:', err);
        this.recommended = [];
        this.cdr.markForCheck();
      },
    });
  }

  // POST /api/v1/users/me/favorites/{productId} y DELETE /api/v1/users/me/favorites/{productId}
  toggleFavorite(product: ProductDTO): void {
    const productId = product.productId;
    if (productId === undefined || this.pendingFavoriteIds.has(productId)) {
      return;
    }

    this.pendingFavoriteIds.add(productId);

    if (this.isFavorite(product)) {
      this.commerceService.removeFavorite(productId).subscribe({
        next: () => {
          this.favorites = this.favorites.filter((fav) => this.favoriteId(fav) !== productId);
          this.favoriteProductIds.delete(productId);
          this.pendingFavoriteIds.delete(productId);
          this.snackBar.open(`"${product.name}" eliminado de favoritos.`, 'Cerrar', {
            duration: 2500,
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al quitar de favoritos:', err);
          this.pendingFavoriteIds.delete(productId);
          this.snackBar.open('No se pudo quitar de favoritos.', 'Cerrar', { duration: 3000 });
          this.cdr.markForCheck();
        },
      });
    } else {
      this.commerceService.addFavorite(productId).subscribe({
        next: (createdFavorite: FavoriteDTO) => {
          // Si el backend no devuelve el producto en el POST, se completa con el producto actual
          const normalizedFavorite: FavoriteDTO = {
            ...createdFavorite,
            productId: createdFavorite?.productId ?? productId,
            product: createdFavorite?.product ?? product,
          };

          this.favorites = [normalizedFavorite, ...this.favorites];
          this.favoriteProductIds.add(productId);
          this.pendingFavoriteIds.delete(productId);
          this.snackBar.open(`"${product.name}" agregado a favoritos.`, 'Cerrar', {
            duration: 2500,
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al agregar a favoritos:', err);
          this.pendingFavoriteIds.delete(productId);
          this.snackBar.open('No se pudo agregar a favoritos.', 'Cerrar', { duration: 3000 });
          this.cdr.markForCheck();
        },
      });
    }
  }

  isFavorite(product: ProductDTO): boolean {
    return product.productId !== undefined && this.favoriteProductIds.has(product.productId);
  }

  isPendingFavorite(productId: number | undefined): boolean {
    return productId !== undefined && this.pendingFavoriteIds.has(productId);
  }

  get allSavedProducts(): ProductDTO[] {
    return this.favorites
      .map((fav) => fav.product)
      .filter((product): product is ProductDTO => !!product);
  }

  get totalSaved(): number {
    return this.allSavedProducts.length;
  }

  get savedProducts(): ProductDTO[] {
    return this.showAllSaved
      ? this.allSavedProducts
      : this.allSavedProducts.slice(0, this.previewSize);
  }

  toggleShowAll(): void {
    this.showAllSaved = !this.showAllSaved;
  }

  // ---------- Imágenes ----------

  productImage(product: ProductDTO): string {
    const principalImg = product.images?.find((img) => img.principal);
    const url = principalImg?.url || product.mainImageUrl || product.images?.[0]?.url || '';
    if (!url || /^https?:\/\//i.test(url)) return url;
    return url.startsWith('/') ? `${this.backendOrigin}${url}` : url;
  }

  hasImage(url: string): boolean {
    return !!url && !this.failedImages.has(url);
  }

  onImageError(url: string): void {
    if (url) {
      this.failedImages.add(url);
      this.cdr.markForCheck();
    }
  }

  // ---------- Acciones ----------

  hasStock(product: ProductDTO): boolean {
    return (product.stock ?? 0) > 0;
  }

  goToProductDetail(product: ProductDTO): void {
    if (product.productId !== undefined) {
      this.router.navigate(['/producto', product.productId]);
    }
  }

  viewInAR(product: ProductDTO): void {
    this.recentlyViewedService.add(product);
    this.snackBar.open('La vista en realidad aumentada estará disponible pronto', 'Cerrar', {
      duration: 2500,
    });
  }

  addToCart(product: ProductDTO): void {
    if (!this.hasStock(product)) {
      this.snackBar.open('Este producto no cuenta con stock disponible.', 'Cerrar', {
        duration: 2500,
      });
      return;
    }

    this.cartService.add(product);
    this.recentlyViewedService.add(product);
    this.snackBar
      .open(`"${product.name}" agregado al carrito.`, 'Ver carrito', { duration: 3500 })
      .onAction()
      .subscribe(() => this.router.navigate(['/carrito']));
  }

  private favoriteId(fav: FavoriteDTO): number | undefined {
    return fav.productId ?? fav.product?.productId;
  }

  private syncFavoriteIds(): void {
    this.favoriteProductIds.clear();
    for (const fav of this.favorites) {
      const id = this.favoriteId(fav);
      if (id !== undefined) {
        this.favoriteProductIds.add(id);
      }
    }
  }
}
