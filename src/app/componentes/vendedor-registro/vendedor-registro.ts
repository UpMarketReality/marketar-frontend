import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabLink, MatTabNav } from '@angular/material/tabs';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { RegisterRequestDTO } from '../../model/register-request-dto';
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
  selector: 'app-vendedor-registro',
  styleUrl: './vendedor-registro.css',
  templateUrl: './vendedor-registro.html',
})
export class VendedorRegistro {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Datos del formulario
  ruc = '';
  nombreEmpresa = '';
  nombreRepresentante = '';
  correo = '';
  password = '';
  confirmarPassword = '';

  // Estado de la pantalla
  errorMessage = '';
  cargando = false;

  registrar(): void {
    if (this.cargando) return;

    this.errorMessage = '';

    // Validaciones que el formulario no cubre por sí solo
    if (this.password !== this.confirmarPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (!/^[0-9]{11}$/.test(this.ruc)) {
      this.errorMessage = 'El RUC debe tener 11 dígitos.';
      return;
    }

    this.cargando = true;

    const registro = new RegisterRequestDTO();
    registro.name = this.nombreRepresentante;
    registro.email = this.correo;
    registro.password = this.password;
    registro.role = 'VENDEDOR';
    registro.storeName = this.nombreEmpresa;
    registro.ruc = this.ruc;

    this.authService.register(registro).subscribe({
      next: () => {
        // Iniciar sesión automáticamente con la cuenta recién creada
        const acceso = new RequestDTO();
        acceso.correo = this.correo;
        acceso.password = this.password;

        this.authService.login(acceso).subscribe({
          next: () => {
            this.cargando = false;
            this.router.navigateByUrl('/perfil-vendedor');
          },
          error: () => {
            // La cuenta sí se creó: el usuario solo debe iniciar sesión
            this.cargando = false;
            this.router.navigateByUrl('/vendedor/inicio-sesion');
          },
        });
      },
      error: (error) => {
        this.cargando = false;

        this.errorMessage =
          error.status === 409
            ? 'Este correo ya está registrado.'
            : (error.error?.message ?? 'No se pudo crear la cuenta. Inténtalo nuevamente.');
      },
    });
  }
}
