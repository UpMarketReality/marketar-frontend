
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Footer } from '../footer/footer';

@Component({
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

}
