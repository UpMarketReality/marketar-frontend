import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestDTO } from '../../model/request-dto';

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
  private request: RequestDTO;
  iniciarSesion(): void {
    if (this.cargando) return;

    this.errorMessage = '';
    this.cargando = true;

    this.request = new RequestDTO();
    this.request.correo = this.correo;
    this.request.password = this.password;

    // Llamamos al servicio que se conecta con Spring Boot
    this.authService.login(this.request).subscribe({
      // Si el backend autentica correctamente
      next: (response) => {
        this.cargando = false;

        console.log('Login correcto:', response.user);

        // Recuperamos la ruta que quería visitar
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

        // Solo permitimos rutas internas de Angular
        const esRutaInterna =
          returnUrl?.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/\\');

        const destino = esRutaInterna ? returnUrl! : '/home1';

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
