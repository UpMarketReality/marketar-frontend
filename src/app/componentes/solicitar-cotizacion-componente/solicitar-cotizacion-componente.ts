import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CreateQuoteRequest } from '../../model/create-quote-request';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrototypeDTO } from '../../model/prototype-dto';
import { UsuarioService } from '../../services/usuario-service';
import { QuoteService } from '../../services/quote-service';
import { PrototypeService } from '../../services/prototype-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-solicitar-cotizacion-componente',
  styleUrl: './solicitar-cotizacion-componente.css',
  templateUrl: './solicitar-cotizacion-componente.html',
})
export class SolicitarCotizacionComponente implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly prototypeService = inject(PrototypeService);
  private readonly quoteService = inject(QuoteService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  prototipo: PrototypeDTO | null = null;
  imagenUrl: string | null = null;

  cargandoPrototipo = true;
  enviando = false;

  mensajeError = '';
  mensajeImagen = '';

  readonly formulario = this.fb.nonNullable.group({
    quantity: [1, [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],

    deliveryAddress: ['', [Validators.required, Validators.maxLength(300)]],

    deliveryZone: ['', [Validators.required, Validators.maxLength(150)]],

    deliveryConditions: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  get controles() {
    return this.formulario.controls;
  }

  get puedeCotizar(): boolean {
    return (
      !this.cargandoPrototipo &&
      !this.enviando &&
      this.prototipo?.generationStatus === 'COMPLETADO' &&
      (this.prototipo.images?.length ?? 0) > 0
    );
  }

  get especificaciones(): string {
    const texto = this.prototipo?.specifications ?? '';

    try {
      return JSON.stringify(JSON.parse(texto), null, 2);
    } catch {
      return texto;
    }
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('prototypeId'));

    if (!Number.isSafeInteger(id) || id <= 0) {
      this.cargandoPrototipo = false;
      this.mensajeError = 'El identificador del diseño no es válido.';
      return;
    }

    this.cargarPrototipo(id);
    this.cargarDireccionGuardada();
  }

  private cargarPrototipo(id: number): void {
    this.cargandoPrototipo = true;
    this.mensajeError = '';

    this.prototypeService
      .obtenerPorId(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargandoPrototipo = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (prototipo) => {
          this.prototipo = prototipo;

          if (prototipo.generationStatus !== 'COMPLETADO') {
            this.mensajeError =
              'El diseño todavía no está completado. ' +
              'Solo puedes cotizar diseños generados correctamente.';
            this.cdr.markForCheck();
            return;
          }

          const imagen = prototipo.images?.find((i) => i.principal) ?? prototipo.images?.[0];

          if (!imagen?.url) {
            this.mensajeError = 'Este diseño no tiene una imagen registrada.';
            this.cdr.markForCheck();
            return;
          }

          this.cargarImagen(prototipo.prototypeId, imagen.url);
        },

        error: (error: HttpErrorResponse) => {
          this.mensajeError = this.mensajeHttp(error, 'No se pudo recuperar el diseño.');
          this.cdr.markForCheck();
        },
      });
  }

  private cargarImagen(id: number, url: string): void {
    this.mensajeImagen = 'Cargando imagen del diseño...';

    this.prototypeService
      .obtenerImagen(id, url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          if (blob.size > 0 && blob.type.startsWith('image/')) {
            if (this.imagenUrl) {
              URL.revokeObjectURL(this.imagenUrl);
            }

            this.imagenUrl = URL.createObjectURL(blob);
            this.mensajeImagen = '';
          } else {
            this.mensajeImagen = 'Imagen no disponible.';
          }

          this.cdr.markForCheck();
        },

        error: () => {
          this.mensajeImagen = 'No se pudo mostrar la imagen del diseño.';
          this.cdr.markForCheck();
        },
      });
  }

  private cargarDireccionGuardada(): void {
    this.usuarioService
      .obtenerMiDireccion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          if (!respuesta.direccion || this.formulario.dirty) {
            return;
          }

          try {
            const datos = JSON.parse(respuesta.direccion);

            if (
              typeof datos.calle === 'string' &&
              typeof datos.distrito === 'string' &&
              typeof datos.region === 'string'
            ) {
              const direccion = [
                datos.calle,
                datos.referencia ? `Referencia: ${datos.referencia}` : '',
              ]
                .filter(Boolean)
                .join(', ');

              this.formulario.patchValue({
                deliveryAddress: direccion.slice(0, 300),
                deliveryZone: `${datos.distrito}, ${datos.region}`.slice(0, 150),
              });
            }
          } catch {
            // Dirección antigua guardada como texto plano.
            this.formulario.patchValue({
              deliveryAddress: respuesta.direccion.slice(0, 300),
            });
          }

          this.cdr.markForCheck();
        },

        error: () => {
          // Es opcional precargar la dirección.
          // El comprador puede escribirla manualmente.
        },
      });
  }

  enviarCotizacion(): void {
    if (this.enviando || !this.puedeCotizar) {
      return;
    }

    this.mensajeError = '';

    if (!this.prototipo) {
      return;
    }

    const valores = this.formulario.getRawValue();

    const direccion = valores.deliveryAddress.trim();
    const zona = valores.deliveryZone.trim();
    const condiciones = valores.deliveryConditions.trim();

    if (this.formulario.invalid || !direccion || !zona || !condiciones) {
      this.formulario.markAllAsTouched();
      this.mensajeError = 'Completa correctamente los datos obligatorios.';
      return;
    }

    const request: CreateQuoteRequest = {
      prototypeId: this.prototipo.prototypeId,
      quantity: valores.quantity,
      deliveryAddress: direccion,
      deliveryZone: zona,
      deliveryConditions: condiciones,
    };

    this.enviando = true;
    this.formulario.disable();

    this.quoteService
      .createQuoteRequest(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.enviando = false;
          this.formulario.enable();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (respuesta) => {
          if (respuesta.requestId == null) {
            this.mensajeError = 'La solicitud se registró, pero no se recibió su ID.';
            this.cdr.markForCheck();
            return;
          }

          this.router.navigate(['/perfil-comprador/cotizacion'], {
            queryParams: {
              requestId: respuesta.requestId,
            },
          });
        },

        error: (error: HttpErrorResponse) => {
          this.mensajeError = this.mensajeHttp(error, 'No se pudo registrar la cotización.');
          this.cdr.markForCheck();
        },
      });
  }

  private mensajeHttp(error: HttpErrorResponse, mensajeDefault: string): string {
    switch (error.status) {
      case 0:
        return 'No hay conexión con el backend.';
      case 401:
        return 'Tu sesión expiró. Inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para esta operación.';
      case 404:
        return 'No se encontró el diseño solicitado.';
      case 409:
        return typeof error.error?.message === 'string'
          ? error.error.message
          : 'El diseño no está disponible para cotización.';
      default:
        return typeof error.error?.message === 'string' ? error.error.message : mensajeDefault;
    }
  }

  ngOnDestroy(): void {
    if (this.imagenUrl) {
      URL.revokeObjectURL(this.imagenUrl);
    }
  }
}
