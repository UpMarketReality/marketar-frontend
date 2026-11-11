
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Footer } from '../footer/footer';

@Component({
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  imports: [FormsModule],
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [RouterLink, FormsModule, Footer],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.css'
})
export class InicioSesion {

  email: string = '';
  password: string = '';

  enviado: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'info' | 'error' = 'info';

  iniciarSesion(formulario: NgForm): void {

    this.enviado = true;
    this.mensaje = '';

    if (formulario.invalid) {
      formulario.control.markAllAsTouched();

      this.tipoMensaje = 'error';
      this.mensaje =
        'Revisa los campos obligatorios y corrige los datos ingresados.';

      return;
    }

    // MAR-10: interfaz de inicio de sesión.
    // La autenticación real requiere conexión con el backend.

    this.tipoMensaje = 'info';
    this.mensaje =
      'Los datos del formulario son válidos. ' +
      'El inicio de sesión real estará disponible ' +
      'cuando se integre el servicio de autenticación.';

  }

  recuperarContrasena(): void {

    this.tipoMensaje = 'info';
    this.mensaje =
      'La recuperación de contraseña estará disponible ' +
      'cuando se implemente el servicio correspondiente.';

  }

  limpiarMensaje(): void {
    this.mensaje = '';
  }

  // Servicios de Angular y autenticación
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Variables del formulario
  correo: string = '';
  password: string = '';

  // Variables para controlar la interfaz
  errorMessage: string = '';
  cargando: boolean = false;

  // Método que se ejecuta al enviar el formulario
  iniciarSesion(): void {
    if (this.cargando) return;

    this.errorMessage = '';
    this.cargando = true;

    // Llamamos al servicio que se conecta con Spring Boot
    this.authService.login(this.correo, this.password).subscribe({
      // Si el backend autentica correctamente
      next: (response) => {
        this.cargando = false;

        console.log('Login correcto:', response.user);

        // Recuperamos la ruta que quería visitar
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

        // Solo permitimos rutas internas de Angular
        const esRutaInterna =
          returnUrl?.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/\\');

        const destino = esRutaInterna ? returnUrl! : '/home';

        // Redirigimos al usuario
        this.router.navigateByUrl(destino);
      },

      // Si el backend rechaza las credenciales
      error: (error) => {
        this.cargando = false;

        if (error.status === 401) {
          this.errorMessage = 'Correo electrónico o contraseña incorrectos.';
        } else {
          this.errorMessage = 'No se pudo iniciar sesión. Inténtalo nuevamente.';
        }

        console.error('Error de autenticación:', error);
      },
    });
  }
}
