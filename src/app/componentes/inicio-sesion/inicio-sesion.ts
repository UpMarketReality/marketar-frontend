import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  imports: [FormsModule],
  selector: 'app-inicio-sesion',
  styleUrl: './inicio-sesion.css',
  templateUrl: './inicio-sesion.html',
})
export class InicioSesion {
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
