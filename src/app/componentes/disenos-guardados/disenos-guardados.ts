import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, catchError, map, finalize, switchMap } from 'rxjs';

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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
export class DisenosGuardados implements OnInit, OnDestroy {
  private readonly commerceService = inject(CommerceService);
  private readonly prototypeService = inject(PrototypeService);
  private readonly quoteService = inject(QuoteService);
  private readonly agregandoAlCarrito = new Set<number>();
  private readonly recentlyViewedService = inject(RecentlyViewedService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly imagenesPrototipos = new Map<number, string>();

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
    this.cargarMisPrototipos();
  }

  cargarMisPrototipos(): void {
    this.loading = true;
    this.errorMessage = '';

    if (!this.authService.isAuthenticated()) {
      this.loading = false;
      this.errorMessage = 'Inicia sesión para ver tus diseños.';
      this.cdr.markForCheck();
      return;
    }

    forkJoin({
      paginaPrototipos: this.prototypeService.getMyPrototypes(0, 20),
      cotizaciones: this.quoteService.getAllMyQuoteRequests(),
      favoritos: this.commerceService.getFavorites().pipe(catchError(() => of([]))),
    })
      .pipe(
        switchMap(({ paginaPrototipos, cotizaciones, favoritos }) => {
          this.favorites = (favoritos ?? [])
            .map((f: any) => f.product ?? f)
            .filter((p: any) => p && p.productId != null);
          const prototipos = paginaPrototipos.content ?? [];

          // Relacionamos cada prototipo con la solicitud más reciente.
          this.quotesByPrototype = this.latestQuoteByPrototype(cotizaciones);

          // Conservamos la carga de imágenes que ya existía.
          const solicitudesImagen = prototipos.map((prototipo) => {
            const imagen =
              prototipo.generationStatus === 'COMPLETADO'
                ? (prototipo.images?.find((i) => i.principal) ?? prototipo.images?.[0])
                : undefined;

            if (!imagen?.url) {
              return of(null);
            }

            return this.prototypeService.obtenerImagen(prototipo.prototypeId, imagen.url).pipe(
              map((blob) => {
                if (!blob.size || !blob.type.startsWith('image/')) {
                  return null;
                }

                return {
                  id: prototipo.prototypeId,
                  url: URL.createObjectURL(blob),
                };
              }),

              catchError((error) => {
                console.warn(
                  'No se pudo cargar la imagen del prototipo',
                  prototipo.prototypeId,
                  error,
                );

                return of(null);
              }),
            );
          });

          if (solicitudesImagen.length === 0) {
            return of({
              prototipos,
              imagenes: [] as Array<{
                id: number;
                url: string;
              } | null>,
            });
          }

          return forkJoin(solicitudesImagen).pipe(
            map((imagenes) => ({
              prototipos,
              imagenes,
            })),
          );
        }),

        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ prototipos, imagenes }) => {
          this.prototypes = prototipos;

          // Liberamos las imágenes de la carga anterior.
          this.liberarImagenes();

          for (const imagen of imagenes) {
            if (imagen) {
              this.imagenesPrototipos.set(imagen.id, imagen.url);
            }
          }

          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error('Error cargando diseños y cotizaciones:', error);

          // No mostramos "Sin cotizar" si falló la consulta.
          this.errorMessage =
            'No se pudo recuperar el estado de tus diseños. ' + 'Inténtalo nuevamente.';

          this.cdr.markForCheck();
        },
      });
  }

  // Si hay varias solicitudes para el mismo prototipo, se usa la más reciente

  private latestQuoteByPrototype(quotes: QuoteRequestDTO[]): Map<number, QuoteRequestDTO> {
    const resultado = new Map<number, QuoteRequestDTO>();

    for (const quote of quotes) {
      if (quote.prototypeId == null) {
        continue;
      }

      const actual = resultado.get(quote.prototypeId);

      if (!actual) {
        resultado.set(quote.prototypeId, quote);
        continue;
      }

      const nuevaActiva = this.tieneCotizacionActiva(quote);
      const actualActiva = this.tieneCotizacionActiva(actual);

      if (nuevaActiva && !actualActiva) {
        resultado.set(quote.prototypeId, quote);
        continue;
      }

      if (
        nuevaActiva === actualActiva &&
        ((quote.createdAt ?? '') > (actual.createdAt ?? '') ||
          (quote.createdAt === actual.createdAt &&
            (quote.requestId ?? 0) > (actual.requestId ?? 0)))
      ) {
        resultado.set(quote.prototypeId, quote);
      }
    }

    return resultado;
  }

  // Recomendados: productos del catálogo que no están en favoritos ni en vistos recientemente.
  // Se priorizan las categorías que el usuario ya guardó y luego la mejor valoración.
  /*private buildRecommendations(catalog: ProductDTO[]): ProductDTO[] {
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
  }*/

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
    return this.imagenesPrototipos.get(prototype.prototypeId);
  }
  private liberarImagenes(): void {
    for (const url of this.imagenesPrototipos.values()) {
      URL.revokeObjectURL(url);
    }

    this.imagenesPrototipos.clear();
  }

  ngOnDestroy(): void {
    this.liberarImagenes();
  }

  quoteStatusLabel(quote?: QuoteRequestDTO): string {
    if (!quote) {
      return 'Sin cotizar';
    }

    const cantidad = quote.offerCount ?? 0;

    switch (quote.status) {
      case 'EN_COTIZACION':
        return 'En cotización';

      case 'COTIZADA':
        return cantidad === 1 ? 'Cotizado · 1 oferta' : `Cotizado · ${cantidad} ofertas`;

      case 'ACEPTADA':
        return 'Oferta aceptada';

      case 'COMPLETADA':
        return 'Completada';

      case 'CANCELADA':
        return 'Cancelada';

      default:
        return quote.status ?? 'Estado desconocido';
    }
  }

  // Clase de color del estado: en-proceso (naranja), aceptada (verde), inactiva (gris)

  quoteStatusClass(quote?: QuoteRequestDTO): string {
    if (!quote) {
      return 'estado--inactiva';
    }

    switch (quote.status) {
      case 'EN_COTIZACION':
      case 'COTIZADA':
        return 'estado--proceso';

      case 'ACEPTADA':
      case 'COMPLETADA':
        return 'estado--aceptada';

      case 'CANCELADA':
        return 'estado--inactiva';

      default:
        return 'estado--inactiva';
    }
  }

  goToQuotes(item: Extract<SavedItem, { kind: 'prototype' }>): void {
    // Si la cotización sigue activa, se muestra su detalle.
    if (this.tieneCotizacionActiva(item.quote) && item.quote?.requestId != null) {
      this.router.navigate(['/perfil-comprador/cotizacion'], {
        queryParams: {
          requestId: item.quote.requestId,
        },
      });
      return;
    }

    // Si no hay una solicitud activa, se puede cotizar
    // de nuevo el mismo diseño.
    if (item.prototype.generationStatus === 'COMPLETADO') {
      this.router.navigate(['/solicitar-cotizacion', item.prototype.prototypeId]);
      return;
    }

    this.snackBar.open('El diseño debe estar completado para solicitar una cotización.', 'Cerrar', {
      duration: 3500,
    });
  }

  tieneCotizacionActiva(quote?: QuoteRequestDTO): boolean {
    return quote?.status === 'EN_COTIZACION' || quote?.status === 'COTIZADA';
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
          this.cdr.markForCheck(); // <-- AGREGAR ESTO
          this.notify('Se agregó a tus diseños guardados');
        },
        error: (err) => {
          console.error('No se pudo agregar a favoritos:', err);
          this.pendingFavorite.delete(id);
          this.cdr.markForCheck(); // <-- AGREGAR ESTO
          this.notify('No se pudo agregar a favoritos');
        },
      });
    }
  }

  addToCart(product: ProductDTO): void {
    if (!this.requireBuyer()) return;

    const productId = product.productId;

    if (productId == null || this.agregandoAlCarrito.has(productId)) {
      return;
    }

    this.agregandoAlCarrito.add(productId);

    this.commerceService
      .addItem(productId, 1)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.agregandoAlCarrito.delete(productId);
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.recentlyViewedService.add(product);

          this.snackBar
            .open(`"${product.name}" se agregó al carrito`, 'Ver carrito', { duration: 3500 })
            .onAction()
            .subscribe(() => {
              this.router.navigate(['/carrito']);
            });
        },

        error: (error) => {
          this.snackBar.open(
            error.error?.message ?? 'No se pudo agregar el producto al carrito',
            'Cerrar',
            { duration: 4000 },
          );
        },
      });
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
    /*if (environment.useMockData) return true; // modo demo: sin login*/
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
