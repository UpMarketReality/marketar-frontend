import { Component, inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { DireccionCompradorRequest } from '../../model/DireccionCompradorRequest';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../services/usuario-service';

@Component({
  imports: [ReactiveFormsModule],
  standalone: true,
  selector: 'app-perfil-comprador-direccion-componente',
  styleUrl: './perfil-comprador-direccion-componente.css',
  templateUrl: './perfil-comprador-direccion-componente.html',
})
export class PerfilCompradorDireccionComponente implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);

  cargandoDireccion = false;
  direccionCargada = false;
  guardandoDireccion = false;

  mensajeExito = '';
  mensajeError = '';
  mensajeAviso = '';

  // Formulario reactivo
  direccionForm = this.fb.nonNullable.group({
    calle: ['', [Validators.required, Validators.maxLength(180)]],

    region: ['', [Validators.required, Validators.maxLength(60)]],

    distrito: ['', [Validators.required, Validators.maxLength(60)]],

    referencia: ['', [Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.cargarDireccion();
  }

  // Recuperar los valores, eliminando espacios sobrantes
  private obtenerDatos(): DireccionCompradorRequest {
    const valores = this.direccionForm.getRawValue();

    return {
      calle: valores.calle.trim(),
      region: valores.region.trim(),
      distrito: valores.distrito.trim(),
      referencia: valores.referencia.trim(),
    };
  }

  // Tamaño del JSON que vamos a almacenar
  get longitudDireccion(): number {
    return JSON.stringify(this.obtenerDatos()).length;
  }

  get superaLimite(): boolean {
    return this.longitudDireccion > 300;
  }

  // Convertir el String JSON recibido a campos
  private cargarFormulario(direccion: string | null): void {
    if (!direccion) {
      this.direccionForm.reset({
        calle: '',
        region: '',
        distrito: '',
        referencia: '',
      });

      return;
    }

    try {
      const datos = JSON.parse(direccion);

      if (
        !datos ||
        typeof datos.calle !== 'string' ||
        typeof datos.region !== 'string' ||
        typeof datos.distrito !== 'string'
      ) {
        throw new Error('Formato de dirección no reconocido');
      }

      this.direccionForm.reset({
        calle: datos.calle,
        region: datos.region,
        distrito: datos.distrito,
        referencia: typeof datos.referencia === 'string' ? datos.referencia : '',
      });
    } catch {
      // Compatibilidad con direcciones antiguas
      // que se guardaron como texto plano.
      this.direccionForm.reset({
        calle: direccion,
        region: '',
        distrito: '',
        referencia: '',
      });

      this.mensajeAviso =
        'Se encontró una dirección guardada en formato anterior. ' +
        'Revisa y completa sus campos antes de guardar.';
    }
  }

  // GET: Consultar dirección
  cargarDireccion(): void {
    this.cargandoDireccion = true;
    this.direccionCargada = false;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.mensajeAviso = '';

    this.usuarioService
      .obtenerMiDireccion()
      .pipe(
        finalize(() => {
          this.cargandoDireccion = false;
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.cargarFormulario(respuesta.direccion);
          this.direccionCargada = true;
        },

        error: (error: HttpErrorResponse) => {
          this.mensajeError = this.obtenerMensajeError(error, 'No se pudo cargar la dirección.');
        },
      });
  }

  // PUT: Guardar dirección
  guardarDireccion(): void {
    if (!this.direccionCargada || this.guardandoDireccion) {
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';

    const datos = this.obtenerDatos();

    if (this.direccionForm.invalid || !datos.calle || !datos.region || !datos.distrito) {
      this.direccionForm.markAllAsTouched();
      this.mensajeError = 'Completa correctamente los campos obligatorios.';
      return;
    }

    if (this.superaLimite) {
      this.mensajeError = 'La dirección completa supera los 300 caracteres.';
      return;
    }

    this.guardandoDireccion = true;

    this.usuarioService
      .actualizarMiDireccion(datos)
      .pipe(
        finalize(() => {
          this.guardandoDireccion = false;
        }),
      )
      .subscribe({
        next: (respuesta) => {
          // Actualizamos el formulario con el valor guardado
          this.cargarFormulario(respuesta.direccion);

          this.mensajeAviso = '';
          this.mensajeExito = 'Tu dirección de envío se guardó correctamente.';

          this.direccionForm.markAsPristine();
        },

        error: (error: HttpErrorResponse) => {
          this.mensajeError = this.obtenerMensajeError(error, 'No se pudo guardar la dirección.');
        },
      });
  }

  private obtenerMensajeError(error: HttpErrorResponse, mensajeGeneral: string): string {
    switch (error.status) {
      case 0:
        return 'No se puede conectar con el servidor.';

      case 400:
        return 'La dirección enviada es inválida o supera el límite permitido.';

      case 401:
        return 'Tu sesión ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para modificar esta dirección.';

      case 404:
        return 'No se encontró el perfil de comprador asociado a tu cuenta.';

      default:
        return mensajeGeneral;
    }
  }
}
