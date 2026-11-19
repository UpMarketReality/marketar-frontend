import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  standalone: true,
  selector: 'app-comprador-layout-componente',
  styleUrl: './comprador-layout-componente.css',
  templateUrl: './comprador-layout-componente.html',
})
export class CompradorLayoutComponente {
  private authService = inject(AuthService);
  private router = inject(Router);

  cerrarSesion(): void {
    // Eliminar el token y los datos de sesión
    this.authService.logout();

    // Redirigir al usuario al Home público
    this.router.navigateByUrl('/home1');
  }
}
