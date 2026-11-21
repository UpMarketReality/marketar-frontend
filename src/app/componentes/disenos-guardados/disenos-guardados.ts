import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, catchError, map } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProductDTO } from '../../model/product-dto';
import { PrototypeDTO } from '../../model/prototype-dto';
import { QuoteRequestDTO } from '../../model/quote-request-dto';
import { CatalogService } from '../../services/catalog-service';
import { CommerceService } from '../../services/commerce-service';
import { PrototypeService } from '../../services/prototype-service';
import { QuoteService } from '../../services/quote-service';
import { CartService } from '../../services/cart-service';
import { RecentlyViewedService } from '../../services/recently-viewed-service';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

// Tarjeta de "Diseños Guardados": puede ser un producto favorito o un diseño propio generado con IA
export type SavedItem =
  | { kind: 'product'; product: ProductDTO }
  | { kind: 'prototype'; prototype: PrototypeDTO; quote?: QuoteRequestDTO };

type StarType = 'full' | 'half' | 'empty';

@Component({
  selector: 'app-disenos-guardados',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './disenos-guardados.html',
  styleUrl: './disenos-guardados.css',
})
export class DisenosGuardados implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly commerceService = inject(CommerceService);
  private readonly prototypeService = inject(PrototypeService);
  private readonly quoteService = inject(QuoteService);
  private readonly cartService = inject(CartService);
  private readonly recentlyViewedService = inject(RecentlyViewedService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // Datos de cada sección
  favorites: ProductDTO[] = [];
  prototypes: PrototypeDTO[] = [];
  private quotesByPrototype = new Map<number, QuoteRequestDTO>();
  recentlyViewed: ProductDTO[] = [];
  recommended: ProductDTO[] = [];

  // Estado de la vista
  loading = true;
  errorMessage = '';
  showAllSaved = false;
  readonly previewSize = 4;
  private readonly brokenImages = new Set<string>();
  private readonly pendingFavorite = new Set<number>();

  ngOnInit(): void {
    this.recentlyViewed = this.recentlyViewedService.getAll().slice(0, this.previewSize);
    //this.loadData();
  }

  // ---------- Carga de datos ----------
/*
  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    const canUsePrivateApi = environment.useMockData || this.authService.isAuthenticated();

    forkJoin({
      favorites: canUsePrivateApi
        ? this.commerceService.getFavorites().pipe(catchError(() => of([])))
        : of([]),
      prototypes: canUsePrivateApi
        ? this.prototypeService.getMyPrototypes().pipe(
            map((page) => page?.content ?? []),
            catchError(() => of([] as PrototypeDTO[])),
          )
        : of([] as PrototypeDTO[]),
      quotes: canUsePrivateApi
        ? this.quoteService.getMyQuoteRequests(0, 50).pipe(
            map((page) => page?.content ?? []),
            catchError(() => of([] as QuoteRequestDTO[])),
          )
        : of([] as QuoteRequestDTO[]),
      catalog: this.catalogService
        .getProducts(undefined, undefined, undefined, undefined, 0, 20)
        .pipe(
          map((page) => page?.content ?? []),
          catchError(() => of([] as ProductDTO[])),
        ),
    }).subscribe({
      next: ({ favorites, prototypes, quotes, catalog }) => {
        this.favorites = favorites
          .map((f) => f.productDTO ?? catalog.find((p) => p.productId === f.productId))
          .filter((p): p is ProductDTO => !!p);

        this.prototypes = prototypes;
        this.quotesByPrototype = this.latestQuoteByPrototype(quotes);
        this.recommended = this.buildRecommendations(catalog);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar Mis Diseños:', err);
        this.errorMessage = 'No se pudo cargar tu información. Inténtalo nuevamente.';
        this.loading = false;
      },
    });
  }*/

  // Si hay varias solicitudes para el mismo prototipo, se usa la más reciente
  private latestQuoteByPrototype(quotes: QuoteRequestDTO[]): Map<number, QuoteRequestDTO> {
    const result = new Map<number, QuoteRequestDTO>();
    for (const q of quotes) {
      if (q.prototypeId == null) continue;
      const current = result.get(q.prototypeId);
      if (!current || (q.createdAt ?? '') > (current.createdAt ?? '')) {
        result.set(q.prototypeId, q);
      }
    }
    return result;
  }

  // Recomendados: productos del catálogo que no están en favoritos ni en vistos recientemente.
  // Se priorizan las categorías que el usuario ya guardó y luego la mejor valoración.
  private buildRecommendations(catalog: ProductDTO[]): ProductDTO[] {
    const excluded = new Set<number | undefined>(
      [...this.favorites, ...this.recentlyViewed].map((p) => p.productId),
    );
    const likedCategories = new Set<number | undefined>(this.favorites.map((p) => p.categoryId));

    return catalog
      .filter((p) => !excluded.has(p.productId))
      .sort((a, b) => {
        const catDiff =
          Number(likedCategories.has(b.categoryId)) - Number(likedCategories.has(a.categoryId));
        return catDiff !== 0 ? catDiff : (b.rating ?? 0) - (a.rating ?? 0);
      })
      .slice(0, this.previewSize);
  }

  // ---------- Sección "Diseños Guardados" ----------

  get totalSaved(): number {
    return this.favorites.length + this.prototypes.length;
  }

  // Vista previa: hasta 3 favoritos + 1 diseño IA (como en el diseño). "Ver todos" muestra el resto.
  get savedItems(): SavedItem[] {
    const favs: SavedItem[] = this.favorites.map((product) => ({ kind: 'product', product }));
    const protos: SavedItem[] = this.prototypes.map((prototype) => ({
      kind: 'prototype',
      prototype,
      quote:
        prototype.prototypeId != null
          ? this.quotesByPrototype.get(prototype.prototypeId)
          : undefined,
    }));

    if (this.showAllSaved) return [...favs, ...protos];

    const protoSlots = Math.min(protos.length, 1);
    const preview = [
      ...favs.slice(0, this.previewSize - protoSlots),
      ...protos.slice(0, protoSlots),
    ];
    // Si faltan favoritos, se completan con más diseños IA
    if (preview.length < this.previewSize) {
      preview.push(...protos.slice(protoSlots, protoSlots + this.previewSize - preview.length));
    }
    return preview;
  }

  toggleShowAll(): void {
    this.showAllSaved = !this.showAllSaved;
  }

  // ---------- Diseños IA y cotizaciones ----------

  prototypeImage(prototype: PrototypeDTO): string | undefined {
    return prototype.images?.find((i) => i.principal)?.url ?? prototype.images?.[0]?.url;
  }

  quoteStatusLabel(quote?: QuoteRequestDTO): string {
    if (!quote) return 'Sin cotizar';
    const offers = quote.offerCount ?? 0;
    const offersText = offers === 1 ? '1 Oferta' : `${offers} Ofertas`;
    switch ((quote.status ?? '').toUpperCase()) {
      case 'OPEN':
      case 'PENDING':
      case 'IN_PROGRESS':
        return offers > 0 ? `En Proceso (${offersText})` : 'Esperando ofertas';
      case 'ACCEPTED':
      case 'COMPLETED':
        return 'Oferta aceptada';
      case 'CANCELLED':
      case 'CANCELED':
        return 'Cancelada';
      case 'EXPIRED':
        return 'Expirada';
      default:
        return quote.status ?? 'Sin estado';
    }
  }

  // Clase de color del estado: en-proceso (naranja), aceptada (verde), inactiva (gris)
  quoteStatusClass(quote?: QuoteRequestDTO): string {
    const status = (quote?.status ?? '').toUpperCase();
    if (['ACCEPTED', 'COMPLETED'].includes(status)) return 'estado--aceptada';
    if (['CANCELLED', 'CANCELED', 'EXPIRED'].includes(status) || !quote) return 'estado--inactiva';
    return 'estado--proceso';
  }

  goToQuotes(quote?: QuoteRequestDTO): void {
    if (quote) {
      this.router.navigate(['/perfil-comprador/cotizacion'], {
        queryParams: { requestId: quote.requestId },
      });
    } else {
      // Aún no se ha solicitado cotización: se lleva al flujo de creación
      this.router.navigate(['/empieza-acrear']);
    }
  }

  // ---------- Acciones de producto ----------

  isFavorite(product: ProductDTO): boolean {
    return this.favorites.some((f) => f.productId === product.productId);
  }

  toggleFavorite(product: ProductDTO): void {
    const id = product.productId;
    if (id == null || this.pendingFavorite.has(id) || !this.requireBuyer()) return;
    this.pendingFavorite.add(id);

    if (this.isFavorite(product)) {
      this.commerceService.removeFavorite(id).subscribe({
        next: () => {
          const index = this.favorites.findIndex((f) => f.productId === id);
          this.favorites = this.favorites.filter((f) => f.productId !== id);
          this.pendingFavorite.delete(id);
          // Permite deshacer la acción desde el snackbar
          this.snackBar
            .open('Se quitó de tus diseños guardados', 'Deshacer', { duration: 4000 })
            .onAction()
            .subscribe(() => this.restoreFavorite(product, index));
        },
        error: (err) => {
          console.error('No se pudo quitar de favoritos:', err);
          this.pendingFavorite.delete(id);
          this.notify('No se pudo quitar de favoritos');
        },
      });
    } else {
      this.commerceService.addFavorite(id).subscribe({
        next: () => {
          this.favorites = [product, ...this.favorites];
          this.pendingFavorite.delete(id);
          this.notify('Se agregó a tus diseños guardados');
        },
        error: (err) => {
          console.error('No se pudo agregar a favoritos:', err);
          this.pendingFavorite.delete(id);
          this.notify('No se pudo agregar a favoritos');
        },
      });
    }
  }

  addToCart(product: ProductDTO): void {
    if (!this.requireBuyer()) return;
    this.cartService.add(product);
    this.recentlyViewedService.add(product);
    this.snackBar
      .open(`"${product.name}" se agregó al carrito`, 'Ver carrito', { duration: 3500 })
      .onAction()
      .subscribe(() => this.router.navigate(['/carrito']));
  }

  private restoreFavorite(product: ProductDTO, index: number): void {
    if (product.productId == null) return;
    this.commerceService.addFavorite(product.productId).subscribe({
      next: () => {
        const list = [...this.favorites];
        list.splice(Math.max(0, index), 0, product);
        this.favorites = list;
      },
      error: () => this.notify('No se pudo restaurar el favorito'),
    });
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }

  viewInAR(product: ProductDTO): void {
    this.recentlyViewedService.add(product);
    // Punto de integración para el visor AR
    this.notify('La vista en realidad aumentada estará disponible pronto');
  }

  private requireBuyer(): boolean {
    if (environment.useMockData) return true; // modo demo: sin login
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/inicio-sesion'], {
        queryParams: { returnUrl: '/disenos-guardados' },
      });
      return false;
    }
    if (!this.authService.hasRole('COMPRADOR')) {
      this.notify('Solo los compradores pueden usar el carrito y favoritos');
      return false;
    }
    return true;
  }

  // ---------- Utilidades de la vista ----------

  productImage(product: ProductDTO): string | undefined {
    return (
      product.mainImageUrl ||
      product.images?.find((i) => i.principal)?.url ||
      product.images?.[0]?.url
    );
  }

  hasImage(url?: string): boolean {
    return !!url && !this.brokenImages.has(url);
  }

  onImageError(url?: string): void {
    if (url) this.brokenImages.add(url);
  }

  starIcon(star: StarType): string {
    return star === 'full' ? 'star' : star === 'half' ? 'star-half' : 'star-outline';
  }

  // Devuelve 5 estrellas (llenas, media o vacías) según la valoración (0 - 5)
  stars(rating: number | undefined): StarType[] {
    const value = Math.max(0, Math.min(5, rating ?? 0));
    return Array.from({ length: 5 }, (_, i) => {
      if (value >= i + 1) return 'full';
      if (value >= i + 0.5) return 'half';
      return 'empty';
    });
  }
}
