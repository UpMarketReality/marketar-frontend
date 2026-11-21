import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabLink, MatTabNav } from '@angular/material/tabs';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { RequestDTO } from '../../model/request-dto';

@Component({
  imports: [
    FormsModule,
    RouterLink,
    RouterLinkActive,
    MatTabNav,
    MatTabLink,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatInput,
    MatIcon,
    MatButton,
  ],
  selector: 'app-vendedor-inicio-sesion',
  styleUrl: './vendedor-inicio-sesion.css',
  templateUrl: './vendedor-inicio-sesion.html',
})
export class VendedorInicioSesion {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Datos del formulario
  correo = '';
  password = '';

  // Estado de la pantalla
  errorMessage = '';
  cargando = false;

  iniciarSesion(): void {
    if (this.cargando) return;

    this.errorMessage = '';
    this.cargando = true;

    const request = new RequestDTO();
    request.correo = this.correo;
    request.password = this.password;

    this.authService.login(request).subscribe({
      next: (respuesta) => {
        this.cargando = false;

        // Solo las cuentas de vendedor pueden entrar a este panel
        if (!respuesta.roles.includes('ROLE_VENDEDOR')) {
          this.authService.logout();
          this.errorMessage =
            'Esta cuenta no es de vendedor. Usa el inicio de sesión de compradores.';
          return;
        }

        // Volver a la ruta que pidió el usuario, solo si es del panel de vendedor
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const esPanel = !!returnUrl && returnUrl.startsWith('/perfil-vendedor');

        this.router.navigateByUrl(esPanel ? returnUrl! : '/perfil-vendedor');
      },
      error: (error) => {
        this.cargando = false;

        this.errorMessage =
          error.status === 401
            ? 'Correo electrónico o contraseña incorrectos.'
            : 'No se pudo iniciar sesión. Inténtalo nuevamente.';
      },
    });
  }
}
