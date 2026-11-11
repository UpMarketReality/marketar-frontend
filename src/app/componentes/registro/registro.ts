
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Footer } from '../footer/footer';

type TipoCuenta = 'comprador' | 'vendedor';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, FormsModule, Footer],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {

  tipoCuenta: TipoCuenta = 'comprador';

  intentoRegistro = false;
  mensajeEstado = '';
  mensajeLegal = '';

  comprador = {
    nombre: '',
    correo: '',
    clave: '',
    confirmarClave: ''
  };

  vendedor = {
    ruc: '',
    empresa: '',
    representante: '',
    correo: '',
    clave: '',
    confirmarClave: ''
  };

  cambiarTipo(tipo: TipoCuenta): void {
    this.tipoCuenta = tipo;
    this.intentoRegistro = false;
    this.mensajeEstado = '';
    this.mensajeLegal = '';
  }

  correoValido(correo: string): boolean {
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return patron.test(correo.trim());
  }

  claveValida(clave: string): boolean {
    return clave.length >= 8 && clave.length <= 64;
  }

  clavesCoinciden(
    clave: string,
    confirmacion: string
  ): boolean {
    return clave === confirmacion;
  }

  rucValido(ruc: string): boolean {
    return /^[0-9]{11}$/.test(ruc);
  }

  registrarComprador(): void {
    this.intentoRegistro = true;
    this.mensajeEstado = '';

    const datos = this.comprador;

    const formularioValido =
      datos.nombre.trim().length > 0 &&
      this.correoValido(datos.correo) &&
      this.claveValida(datos.clave) &&
      datos.confirmarClave.length > 0 &&
      this.clavesCoinciden(
        datos.clave,
        datos.confirmarClave
      );

    if (!formularioValido) {
      this.mensajeEstado =
        'Revisa los campos obligatorios y corrige los datos ingresados.';
      return;
    }

    this.mensajeEstado =
      'Los datos son válidos. El registro de cuentas estará disponible cuando se integre el servicio de autenticación.';
  }

  registrarVendedor(): void {
    this.intentoRegistro = true;
    this.mensajeEstado = '';

    const datos = this.vendedor;

    const formularioValido =
      this.rucValido(datos.ruc) &&
      datos.empresa.trim().length > 0 &&
      datos.representante.trim().length > 0 &&
      this.correoValido(datos.correo) &&
      this.claveValida(datos.clave) &&
      datos.confirmarClave.length > 0 &&
      this.clavesCoinciden(
        datos.clave,
        datos.confirmarClave
      );

    if (!formularioValido) {
      this.mensajeEstado =
        'Revisa los campos obligatorios y corrige los datos ingresados.';
      return;
    }

    this.mensajeEstado =
      'Los datos de la empresa son válidos. El registro real estará disponible cuando se integre el backend.';
  }

  mostrarInformacionLegal(): void {
    this.mensajeLegal =
      'Los términos de servicio y la política de privacidad estarán disponibles cuando se publiquen sus páginas correspondientes.';
  }
}
