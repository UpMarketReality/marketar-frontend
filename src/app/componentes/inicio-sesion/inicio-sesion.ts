import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestDTO } from '../../model/request-dto';
import { finalize } from 'rxjs';
import { RegisterRequestDTO } from '../../model/register-request-dto';

type ModoAuth = 'login' | 'registro';
type TipoCuenta = 'COMPRADOR' | 'VENDEDOR';

// Validador personalizado: las contraseñas deben coincidir.
function validarContrasenas(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmacion = control.get('confirmarPassword')?.value;

  return password === confirmacion ? null : { passwordsNoCoinciden: true };
}

@Component({
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  selector: 'app-inicio-sesion',
  styleUrl: './inicio-sesion.css',
  templateUrl: './inicio-sesion.html',
})
export class InicioSesion {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  modo: ModoAuth = 'login';
  tipoCuenta: TipoCuenta = 'COMPRADOR';

  cargando = false;
  errorMessage = '';
  mensajeExito = '';

  // FORMULARIO DE LOGIN
  loginForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  // FORMULARIO DE REGISTRO
  registroForm = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      documento: [''],
      storeName: [''],
      ruc: [''],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(64)]],
      confirmarPassword: ['', Validators.required],
    },
    {
      validators: validarContrasenas,
    },
  );

  ngOnInit(): void {
    // Permite reutilizar este componente en varias rutas.
    this.modo = this.route.snapshot.data['modo'] ?? 'login';
    this.tipoCuenta = this.route.snapshot.data['tipoCuenta'] ?? 'COMPRADOR';

    this.actualizarValidadores();
  }

  // CAMBIAR PESTAÑA
  cambiarModo(modo: ModoAuth): void {
    if (this.cargando) return;

    this.modo = modo;
    this.errorMessage = '';
    this.mensajeExito = '';
  }

  // CAMBIAR ENTRE COMPRADOR Y VENDEDOR
  cambiarTipo(tipo: TipoCuenta): void {
    if (this.cargando) return;

    this.tipoCuenta = tipo;
    this.errorMessage = '';

    this.actualizarValidadores();
  }

  // VALIDACIONES SEGÚN EL TIPO DE CUENTA
  private actualizarValidadores(): void {
    const f = this.registroForm.controls;

    if (this.tipoCuenta === 'COMPRADOR') {
      f.documento.setValidators([Validators.required, Validators.pattern(/^[0-9]{8}$/)]);

      f.ruc.clearValidators();
      f.storeName.clearValidators();
    } else {
      f.ruc.setValidators([Validators.required, Validators.pattern(/^[0-9]{11}$/)]);

      f.storeName.setValidators([Validators.required, Validators.maxLength(100)]);

      f.documento.clearValidators();
    }

    f.documento.updateValueAndValidity();
    f.ruc.updateValueAndValidity();
    f.storeName.updateValueAndValidity();
  }

  // INICIAR SESIÓN
  iniciarSesion(): void {
    if (this.cargando) return;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    const valores = this.loginForm.getRawValue();

    const request = new RequestDTO();
    request.correo = valores.correo.trim().toLowerCase();
    request.password = valores.password;

    this.authService
      .login(request)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (response) => {
          const esVendedor = response.roles.includes('ROLE_VENDEDOR');

          const esComprador = response.roles.includes('ROLE_COMPRADOR');

          if (!esVendedor && !esComprador) {
            this.authService.logout();
            this.errorMessage = 'Tu cuenta no tiene un rol válido.';
            return;
          }

          this.redirigirUsuario(esVendedor);
        },

        error: (error) => {
          this.errorMessage =
            error.status === 401
              ? 'Correo o contraseña incorrectos.'
              : 'No se pudo iniciar sesión.';
        },
      });
  }

  // REDIRIGIR SEGÚN EL ROL REAL DEL BACKEND
  private redirigirUsuario(esVendedor: boolean): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    const rutaInterna =
      !!returnUrl &&
      returnUrl.startsWith('/') &&
      !returnUrl.startsWith('//') &&
      !returnUrl.startsWith('/\\');

    const path = returnUrl?.split(/[?#]/)[0] ?? '';

    // Evitar que un vendedor vuelva a una página
    // exclusiva de comprador, o viceversa.
    const rutaPermitida = esVendedor
      ? /^\/perfil-vendedor(?:\/|$)/.test(path)
      : /^\/(?:carrito|perfil-comprador|disenos-guardados|empieza-acrear|pagos|catalogo)(?:\/|$)/.test(
          path,
        );

    const destino =
      rutaInterna && rutaPermitida ? returnUrl! : esVendedor ? '/perfil-vendedor' : '/home1';

    this.router
      .navigateByUrl(destino)
      .then((ok) => {
        if (!ok) {
          this.errorMessage = 'No se pudo abrir la página solicitada.';
        }
      })
      .catch(() => {
        this.errorMessage = 'Ocurrió un error al navegar.';
      });
  }

  // REGISTRAR COMPRADOR O VENDEDOR
  registrar(): void {
    if (this.cargando) return;

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.mensajeExito = '';
    this.cargando = true;

    const datos = this.registroForm.getRawValue();

    const request = new RegisterRequestDTO();

    // Datos comunes
    request.name = datos.nombre.trim();
    request.email = datos.correo.trim().toLowerCase();
    request.password = datos.password;
    request.role = this.tipoCuenta;

    // Datos específicos
    if (this.tipoCuenta === 'COMPRADOR') {
      request.documento = datos.documento.trim();
    } else {
      request.storeName = datos.storeName.trim();
      request.ruc = datos.ruc.trim();
    }

    this.authService
      .register(request)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: () => {
          // Se crea la cuenta; el usuario debe
          // iniciar sesión para obtener su JWT.
          this.loginForm.patchValue({
            correo: request.email,
            password: '',
          });

          this.registroForm.reset();
          this.modo = 'login';

          this.mensajeExito = 'Cuenta registrada correctamente. ' + 'Ahora puedes iniciar sesión.';
        },

        error: (error) => {
          if (error.status === 409) {
            this.errorMessage = 'El correo o documento ya está registrado.';
          } else if (error.status === 400) {
            this.errorMessage = error.error?.message ?? 'Revisa los datos ingresados.';
          } else {
            this.errorMessage = 'No se pudo registrar la cuenta.';
          }
        },
      });
  }
}
