import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder, ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UsuarioService } from '../../services/usuario-service';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-perfil-comprador-datos-componente',
  styleUrl: './perfil-comprador-datos-componente.css',
  templateUrl: './perfil-comprador-datos-componente.html',
})
export class PerfilCompradorDatosComponente {
  private fb = inject(FormBuilder);
  private service = inject(UsuarioService);

  cargandoPerfil = false;
  perfilCargado = false;
  guardandoPerfil = false;
  guardandoPassword = false;

  mensajePerfil = '';
  errorPerfil = '';
  mensajePassword = '';
  errorPassword = '';

  // Formulario de información personal
  perfilForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
    correo: [''],
    documento: ['', [Validators.required, Validators.pattern('^[A-Za-z0-9]{8,12}$')]],
  });

  // Validar coincidencia de contraseñas
  private validarPasswords: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const nueva = control.get('passwordNueva')?.value;
    const confirmar = control.get('confirmarPassword')?.value;

    return nueva === confirmar ? null : { passwordsNoCoinciden: true };
  };

  // Formulario de seguridad
  passwordForm = this.fb.nonNullable.group(
    {
      passwordActual: ['', Validators.required],
      passwordNueva: [
        '',
        [Validators.required, Validators.minLength(12), Validators.maxLength(128)],
      ],
      confirmarPassword: ['', Validators.required],
    },
    {
      validators: this.validarPasswords,
    },
  );

  ngOnInit(): void {
    this.cargarPerfil();
  }

  // Consultar el perfil desde Spring Boot
  cargarPerfil(): void {
    this.cargandoPerfil = true;
    this.perfilCargado = false;
    this.errorPerfil = '';
    this.mensajePerfil = '';

    this.service
      .obtenerMiPerfil()
      .pipe(finalize(() => (this.cargandoPerfil = false)))
      .subscribe({
        next: (usuario) => {
          this.perfilForm.reset({
            nombre: usuario.nombre,
            telefono: usuario.telefono ?? '',
            correo: usuario.correo,
            documento: usuario.documento ?? '',
          });

          this.perfilCargado = true;
        },
        error: (error: HttpErrorResponse) => {
          this.errorPerfil = this.obtenerError(error, 'No se pudieron cargar tus datos.');
        },
      });
  }

  // Guardar datos personales
  guardarPerfil(): void {
    if (!this.perfilCargado || this.guardandoPerfil) {
      return;
    }

    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.guardandoPerfil = true;
    this.mensajePerfil = '';
    this.errorPerfil = '';

    const valores = this.perfilForm.getRawValue();

    const datos = {
      nombre: valores.nombre.trim(),
      telefono: valores.telefono.trim(),
      documento: valores.documento.trim(),
    };

    this.service
      .actualizarPerfil(datos)
      .pipe(finalize(() => (this.guardandoPerfil = false)))
      .subscribe({
        next: (usuario) => {
          this.perfilForm.reset({
            nombre: usuario.nombre,
            telefono: usuario.telefono ?? '',
            correo: usuario.correo,
            documento: usuario.documento ?? '',
          });

          this.mensajePerfil = 'Tu información se actualizó correctamente.';
        },
        error: (error: HttpErrorResponse) => {
          this.errorPerfil = this.obtenerError(error, 'No se pudo actualizar el perfil.');
        },
      });
  }

  // Guardar nueva contraseña
  cambiarPassword(): void {
    if (this.guardandoPassword) return;

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.guardandoPassword = true;
    this.errorPassword = '';
    this.mensajePassword = '';

    const valores = this.passwordForm.getRawValue();

    const datos = {
      passwordActual: valores.passwordActual,
      passwordNueva: valores.passwordNueva,
    };

    this.service
      .cambiarPassword(datos)
      .pipe(finalize(() => (this.guardandoPassword = false)))
      .subscribe({
        next: () => {
          this.mensajePassword = 'Contraseña actualizada correctamente.';

          this.passwordForm.reset();
        },
        error: (error: HttpErrorResponse) => {
          this.errorPassword = this.obtenerError(
            error,
            'No se pudo cambiar la contraseña. ' +
              'Verifica que la contraseña actual sea correcta ' +
              'y que la nueva sea diferente.',
          );
        },
      });
  }

  private obtenerError(error: HttpErrorResponse, mensajeGeneral: string): string {
    switch (error.status) {
      case 0:
        return 'No se puede conectar con el servidor.';
      case 401:
        return 'Tu sesión no es válida. Inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'No se encontró el usuario solicitado.';
      case 409:
        return 'El documento ya está registrado en otra cuenta.';
      default:
        return mensajeGeneral;
    }
  }
}
