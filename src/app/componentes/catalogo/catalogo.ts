import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CatalogService } from '../../services/catalog-service';
import { ProductDTO } from '../../model/product-dto';
import { CategoryDTO } from '../../model/category-dto';

import {Router} from '@angular/router';
import { MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {CommerceService} from '../../services/commerce-service';
import {AuthService} from '../../core/auth/auth.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css'],
})
export class CatalogComponent implements OnInit, OnDestroy {
  private catalogService = inject(CatalogService);
  // La app no usa zone.js: hay que avisar a Angular cuando llegan datos asíncronos
  private cdr = inject(ChangeDetectorRef);
  private commerceService = inject(CommerceService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Datos del backend
  products: ProductDTO[] = [];
  categories: CategoryDTO[] = [];

  // Filtros y estado
  searchQuery = '';
  selectedCategoryId?: number;
  sortBy: 'recent' | 'priceAsc' | 'priceDesc' = 'recent';
  isLoading = false;
  errorMessage = '';
  showAllProducts = false;

  // Paginación (8 por página: 4 en "Lo más novedoso" y 4 en "Lo más vendido")
  currentPage = 0;
  pageSize = 8;
  totalPages = 0;
  totalElements = 0;

  // Favoritos locales (opcional si aún no tienes endpoint de favoritos)
  favoriteIds = new Set<number>();

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadFavorites();

    // Debounce para evitar llamadas excesivas al escribir en el buscador
    this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchQuery = term;
        this.currentPage = 0;
        this.loadProducts();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.catalogService
      .getProductCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.categories = data;
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error al cargar categorías:', err),
      });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.catalogService
      .getProducts(
        this.searchQuery || undefined,
        this.selectedCategoryId,
        undefined,
        undefined,
        this.currentPage,
        this.pageSize,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.products = this.applyLocalSort(page.content ?? []);
          this.totalPages = page.totalPages ?? 1;
          this.totalElements = page.totalElements ?? this.products.length;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error al cargar productos:', err);
          this.errorMessage = 'No se pudieron cargar los productos. Intenta nuevamente.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  selectCategory(categoryId?: number): void {
    this.selectedCategoryId = categoryId;
    this.currentPage = 0;
    this.loadProducts();
  }

  // Activa el modo "Ver todos"
  viewAllProducts(): void {
    this.showAllProducts = true;
    this.selectedCategoryId = undefined;
    this.searchQuery = '';
    this.currentPage = 0;
    this.pageSize = 24;
    this.loadProducts();
  }

  // Regresa a la vista original de 2 secciones (4 + 4)
  backToSections(): void {
    this.showAllProducts = false;
    this.currentPage = 0;
    this.pageSize = 8;
    this.loadProducts();
  }

  onSortChange(): void {
    this.products = this.applyLocalSort([...this.products]);
  }

  private applyLocalSort(items: ProductDTO[]): ProductDTO[] {
    if (this.sortBy === 'priceAsc') {
      return items.sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));
    }
    if (this.sortBy === 'priceDesc') {
      return items.sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0));
    }
    return items;
  }

  // División visual para las dos secciones de 4 tarjetas
  get newestProducts(): ProductDTO[] {
    return this.products.slice(0, 4);
  }

  get bestSellerProducts(): ProductDTO[] {
    return this.products.slice(4, 8);
  }

  // Marca en el catálogo los favoritos que el usuario ya tiene guardados
  loadFavorites(): void {
    if (!this.authService.isAuthenticated() || !this.authService.hasRole('COMPRADOR')) return;

    this.commerceService.getFavorites().subscribe({
      next: (favs) => {
        this.favoriteIds = new Set(
          (favs ?? [])
            .map((f) => f.productId ?? f.product?.productId)
            .filter((id): id is number => typeof id === 'number'),
        );
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error al cargar favoritos:', err),
    });
  }

  toggleFavorite(productId: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    // 1) Sin sesión: mensaje y opción de ir al login (vuelve al catálogo después)
    if (!this.authService.isAuthenticated()) {
      this.snackBar
        .open('Necesita iniciar sesión para completar la acción', 'Iniciar sesión', {
          duration: 4000,
        })
        .onAction()
        .subscribe(() =>
          this.router.navigate(['/inicio-sesion'], { queryParams: { returnUrl: '/catalogo' } }),
        );
      return;
    }

    // 2) Solo los compradores tienen favoritos
    if (!this.authService.hasRole('COMPRADOR')) {
      this.snackBar.open('Solo los compradores pueden guardar favoritos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // 3) Con sesión: actualización optimista (cambia al instante y revierte si hay error)
    const nextFavorites = new Set(this.favoriteIds);

    if (nextFavorites.has(productId)) {
      nextFavorites.delete(productId);
      this.favoriteIds = nextFavorites;
      this.cdr.markForCheck();

      this.commerceService.removeFavorite(productId).subscribe({
        next: () => {
          this.snackBar.open('Se quitó de tus diseños guardados', 'Cerrar', { duration: 2500 });
        },
        error: () => {
          // Revierte si falló el backend
          this.favoriteIds = new Set(this.favoriteIds).add(productId);
          this.cdr.markForCheck();
          this.snackBar.open('No se pudo quitar de favoritos', 'Cerrar', { duration: 3000 });
        },
      });
    } else {
      nextFavorites.add(productId);
      this.favoriteIds = nextFavorites;
      this.cdr.markForCheck();

      this.commerceService.addFavorite(productId).subscribe({
        next: () => {
          this.snackBar
            .open('Se agregó a tus diseños guardados', 'Ver Mis Diseños', { duration: 3500 })
            .onAction()
            .subscribe(() => this.router.navigate(['/disenos-guardados']));
        },
        error: () => {
          // Revierte si falló el backend
          const reverted = new Set(this.favoriteIds);
          reverted.delete(productId);
          this.favoriteIds = reverted;
          this.cdr.markForCheck();
          this.snackBar.open('No se pudo agregar a favoritos', 'Cerrar', { duration: 3000 });
        },
      });
    }
  }

  isFavorite(productId: number): boolean {
    return this.favoriteIds.has(productId);
  }

  addToCart(product: ProductDTO, event: Event): void {
    event.stopPropagation();
    console.log('Agregado al carrito:', product);
    // Aquí conectarías tu CartService
  }

  openAR(product: ProductDTO, event: Event): void {
    event.stopPropagation();
    console.log('Abrir vista AR para:', product);
  }

  // Paginación
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get visiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    if (this.totalPages <= 5) {
      for (let i = 0; i < this.totalPages; i++) pages.push(i);
    } else {
      pages.push(0, 1, 2, '...', this.totalPages - 1);
    }
    return pages;
  }

  getStars(rating: number = 5): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? 1 : 0));
  }
}
