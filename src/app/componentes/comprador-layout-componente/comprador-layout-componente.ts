import { Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { UsuarioService } from '../../services/usuario-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  standalone: true,
  selector: 'app-comprador-layout-componente',
  styleUrl: './comprador-layout-componente.css',
  templateUrl: './comprador-layout-componente.html',
})
export class CompradorLayoutComponente {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Estado reactivo compartido
  readonly perfil = this.usuarioService.perfilActual;

  // Nombre inicial proporcionado por el login
  readonly nombreSesion =
    this.authService.getUser()?.name ?? 'Comprador';

  ngOnInit(): void {
    // Evitar mostrar datos guardados de otra cuenta
    this.usuarioService.limpiarPerfil();

    // Consultar el perfil real desde PostgreSQL
    this.usuarioService.obtenerMiPerfil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          console.error(
            'No se pudo cargar el perfil del comprador',
            error
          );
        }
      });
  }

  cerrarSesion(): void {
    this.usuarioService.limpiarPerfil();
    this.authService.logout();
    this.router.navigateByUrl('/home1');
  }
}
