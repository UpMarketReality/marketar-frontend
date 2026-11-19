import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProductDTO } from '../../model/product-dto';
import { CategoryDTO } from '../../model/category-dto';
import { PageDTO } from '../../model/page-dto';
import { CatalogService } from '../../services/catalog-service';
import { CommerceService } from '../../services/commerce-service';
import { CartService } from '../../services/cart-service';
import { AuthService } from '../../core/auth/auth.service';
import { RecentlyViewedService } from '../../services/recently-viewed-service';
import { environment } from '../../../environments/environment';

type SortOption = 'recientes' | 'precio-asc' | 'precio-desc';
type StarType = 'full' | 'half' | 'empty';

// Valor del chip "Todos" (mat-chip-listbox necesita un valor distinto de null)
const ALL_CATEGORIES = 'todos';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly commerceService = inject(CommerceService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly recentlyViewed = inject(RecentlyViewedService);
  private readonly snackBar = inject(MatSnackBar);

  readonly allCategories = ALL_CATEGORIES;

  // Productos de las dos secciones
  customProducts: ProductDTO[] = [];
  bestSellerProducts: ProductDTO[] = [];

  // Categorías (GET /product-categories; si falla se usan estas por defecto)
  categories: CategoryDTO[] = [
    { categoryId: 1, name: 'Armarios & Closets' },
    { categoryId: 2, name: 'Mesas de Noche' },
    { categoryId: 3, name: 'Sillones & Sofás' },
    { categoryId: 4, name: 'Escritorios' },
    { categoryId: 5, name: 'Comedores' },
    { categoryId: 6, name: 'Estanterías' },
  ];

  // Estado de carga y filtros
  loading = true;
  errorMessage = '';
  searchQuery = '';
  selectedCategoryId: number | null = null; // null = "Todos"

  // Ordenamiento (cliente, sobre la página actual)
  sortOption: SortOption = 'recientes';
  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recientes', label: 'Más recientes' },
    { value: 'precio-asc', label: 'Precio: menor a mayor' },
    { value: 'precio-desc', label: 'Precio: mayor a menor' },
  ];

  // Paginación (mat-paginator usa páginas base 0, igual que el backend)
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  readonly pageSize = 12;
  private readonly bestSellerSize = 4;

  // Favoritos del usuario
  private favoriteIds = new Set<number>();

  ngOnInit(): void {
    this.loadCategories();
    this.loadBestSellers();
    this.loadFavorites();
    this.loadProducts();
  }

  // ---------- Carga de datos ----------

  loadCategories(): void {
    this.catalogService.getProductCategories().subscribe({
      next: (cats) => {
        if (Array.isArray(cats) && cats.length > 0) this.categories = cats;
      },
      error: (err) =>
        console.warn('No se pudieron cargar las categorías, se usan las por defecto.', err),
    });
  }

  loadProducts(page: number = 0): void {
    this.loading = true;
    this.errorMessage = '';

    this.catalogService
      .getProducts(
        this.searchQuery,
        this.selectedCategoryId ?? undefined,
        undefined,
        undefined,
        page,
        this.pageSize,
      )
      .subscribe({
        next: (res) => {
          this.customProducts = this.sortProducts(res?.content ?? []);
          this.currentPage = this.pageNumberOf(res, page);
          this.totalPages = res?.totalPages ?? 0;
          this.totalElements = res?.totalElements ?? this.customProducts.length;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar el catálogo:', err);
          this.customProducts = [];
          this.totalPages = 0;
          this.totalElements = 0;
          this.errorMessage = 'No se pudieron cargar los diseños del catálogo.';
          this.loading = false;
        },
      });
  }

  // "Lo más vendidos": productos con más reseñas de la primera página del catálogo
  loadBestSellers(): void {
    this.catalogService.getProducts(undefined, undefined, undefined, undefined, 0, 20).subscribe({
      next: (res) =>
        (this.bestSellerProducts = [...(res?.content ?? [])]
          .sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
          .slice(0, this.bestSellerSize)),
      error: () => (this.bestSellerProducts = []),
    });
  }

  private loadFavorites(): void {
    if (!environment.useMockData && !this.authService.isAuthenticated()) return;
    this.commerceService.getFavorites().subscribe({
      next: (favs) => {
        this.favoriteIds = new Set(
          (favs ?? [])
            .map((f) => f.productId ?? f.productDTO?.productId)
            .filter((id): id is number => typeof id === 'number'),
        );
      },
      error: () => (this.favoriteIds = new Set()),
    });
  }

  // ---------- Búsqueda, filtros y orden ----------

  onSearch(): void {
    this.loadProducts(0);
  }

  // Si el usuario borra el texto, se recarga el catálogo completo
  onSearchChange(value: string): void {
    if (value.trim() === '') this.loadProducts(0);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadProducts(0);
  }

  // Valor seleccionado del mat-chip-listbox
  get selectedChip(): number | string {
    return this.selectedCategoryId ?? ALL_CATEGORIES;
  }

  onCategoryChange(value: number | string | undefined): void {
    // Si se vuelve a pulsar el chip activo, el listbox emite undefined: se ignora
    if (value === undefined) return;
    this.selectCategory(value === ALL_CATEGORIES ? null : Number(value));
  }

  selectCategory(categoryId: number | null | undefined): void {
    this.selectedCategoryId = categoryId ?? null;
    this.loadProducts(0);
  }

  get sortLabel(): string {
    return this.sortOptions.find((o) => o.value === this.sortOption)?.label ?? '';
  }

  setSort(option: SortOption): void {
    this.sortOption = option;
    this.customProducts = this.sortProducts(this.customProducts);
  }

  private sortProducts(products: ProductDTO[]): ProductDTO[] {
    const list = [...products];
    switch (this.sortOption) {
      case 'precio-asc':
        return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case 'precio-desc':
        return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      default:
        return list.sort((a, b) => (b.productId ?? 0) - (a.productId ?? 0));
    }
  }

  // ---------- Paginación (mat-paginator) ----------

  onPageChange(event: PageEvent): void {
    this.loadProducts(event.pageIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private pageNumberOf(res: PageDTO<ProductDTO> | null | undefined, fallback: number): number {
    return res?.page ?? res?.number ?? fallback;
  }

  // ---------- Acciones de la tarjeta ----------

  getImageUrl(product: ProductDTO): string {
    const url =
      product.mainImageUrl ||
      product.images?.find((i) => i.principal)?.url ||
      product.images?.[0]?.url;
    return url ? `url('${url}')` : '';
  }

  stars(rating: number | undefined): StarType[] {
    const value = Math.max(0, Math.min(5, rating ?? 0));
    return Array.from({ length: 5 }, (_, i) =>
      value >= i + 1 ? 'full' : value >= i + 0.5 ? 'half' : 'empty',
    );
  }

  starIcon(star: StarType): string {
    return star === 'full' ? 'star' : star === 'half' ? 'star-half' : 'star-outline';
  }

  isFavorite(product: ProductDTO): boolean {
    return product.productId !== undefined && this.favoriteIds.has(product.productId);
  }

  addToCart(product: ProductDTO): void {
    if (!this.requireBuyer()) return;
    this.recentlyViewed.add(product);
    this.cartService.add(product);
    this.snackBar
      .open(`"${product.name}" se agregó al carrito`, 'Ver carrito', { duration: 3500 })
      .onAction()
      .subscribe(() => this.router.navigate(['/carrito']));
  }

  toggleFavorite(product: ProductDTO): void {
    const id = product.productId;
    if (id === undefined || !this.requireBuyer()) return;
    this.recentlyViewed.add(product);

    if (this.favoriteIds.has(id)) {
      this.commerceService.removeFavorite(id).subscribe({
        next: () => {
          this.favoriteIds.delete(id);
          this.notify('Se quitó de tus favoritos');
        },
        error: () => this.notify('No se pudo quitar de favoritos'),
      });
    } else {
      this.commerceService.addFavorite(id).subscribe({
        next: () => {
          this.favoriteIds.add(id);
          this.snackBar
            .open('Se agregó a tus favoritos', 'Ver mis diseños', { duration: 3500 })
            .onAction()
            .subscribe(() => this.router.navigate(['/disenos-guardados']));
        },
        error: () => this.notify('No se pudo agregar a favoritos'),
      });
    }
  }

  viewInAR(product: ProductDTO): void {
    // Aún no existe una vista AR en el frontend; se deja el punto de integración.
    this.recentlyViewed.add(product);
    this.notify('La vista en realidad aumentada estará disponible pronto');
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }

  // Redirige al login (y vuelve al catálogo) si no hay sesión de comprador
  private requireBuyer(): boolean {
    if (environment.useMockData) return true; // modo demo: sin login
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/inicio-sesion'], { queryParams: { returnUrl: '/catalogo' } });
      return false;
    }
    if (!this.authService.hasRole('COMPRADOR')) {
      this.notify('Solo los compradores pueden usar el carrito y favoritos');
      return false;
    }
    return true;
  }
}
