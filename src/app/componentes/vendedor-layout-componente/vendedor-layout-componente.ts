import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { MatNavList, MatListItem, MatListItemIcon } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-vendedor-layout-componente',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatNavList,
    MatListItem,
    MatListItemIcon,
    MatIcon,
    MatButton,
  ],
  styleUrl: './vendedor-layout-componente.css',
  templateUrl: './vendedor-layout-componente.html',
})
export class VendedorLayoutComponente {
  private readonly router = inject(Router);

  // URL actual, se actualiza en cada navegación
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // "Mis productos" sigue seleccionado tanto en Catálogo Activo como en Añadir Nuevo
  readonly productosActivo = computed(() => {
    const url = this.url();
    return (
      url.startsWith('/perfil-vendedor/productos') ||
      url.startsWith('/perfil-vendedor/nuevo-producto')
    );
  });
}
