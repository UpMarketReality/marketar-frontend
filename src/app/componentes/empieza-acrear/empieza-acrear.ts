import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrototypeDTO } from '../../model/prototype-dto';
import {
  exhaustMap,
  filter,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
  throwError,
  timeout,
  TimeoutError,
  timer,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { PrototypeRequest } from '../../model/prototype-request';
import { PrototypeService } from '../../services/prototype-service';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-empieza-acrear',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './empieza-acrear.html',
  styleUrl: './empieza-acrear.css',
})
export class EmpiezaACrear implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PrototypeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // SOLO PARA EL SCRIPT SQL ACTUAL.
  // Sustituir por el ID obtenido del backend
  // cuando definan las categorías finales.
  readonly categoriaIdMobiliario = 1;

  readonly tiposMueble = ['Mesa', 'Cama', 'Sofá', 'Escritorio', 'Armario', 'Cómoda'];

  readonly estilos = ['Moderno', 'Minimalista', 'Industrial', 'Rústico', 'Vintage'];

  readonly materiales = ['Madera', 'Metal', 'Plástico', 'Bambú', 'Vidrio', 'Otro'];

  readonly formulario = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),

    prompt: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(500),
    ]),

    tipoMueble: this.fb.nonNullable.control(''),

    style: this.fb.nonNullable.control(''),

    material: this.fb.nonNullable.control('', [Validators.required]),

    color: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),

    width: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),

    height: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),

    depth: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),

    unit: this.fb.nonNullable.control<'mm' | 'cm' | 'm'>('cm'),
  });

  cargando = false;
  mensajeEstado = '';
  mensajeError = '';

  prototipo: PrototypeDTO | null = null;
  imagenUrl: string | null = null;

  get cantidadCaracteres(): number {
    return this.formulario.controls.prompt.value.length;
  }

  get puedeConsultar(): boolean {
    return (
      !this.cargando &&
      !!this.prototipo?.prototypeId &&
      this.prototipo.generationStatus !== 'COMPLETADO' &&
      this.prototipo.generationStatus !== 'ERROR'
    );
  }

  seleccionarFiltro(campo: 'tipoMueble' | 'style' | 'material', valor: string): void {
    const control = this.formulario.controls[campo];

    control.setValue(control.value === valor ? '' : valor);

    control.markAsTouched();
  }

  generarDiseno(): void {
    if (this.cargando) return;

    this.mensajeError = '';

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.mensajeError = 'Completa los campos obligatorios y revisa las dimensiones.';
      return;
    }

    const datos = this.formulario.getRawValue();

    // Evita enviar cadenas que contienen solo espacios.
    if (
      !datos.name.trim() ||
      !datos.prompt.trim() ||
      !datos.material.trim() ||
      !datos.color.trim()
    ) {
      this.mensajeError = 'El nombre, la descripción, el material y el color son obligatorios.';
      return;
    }

    if (datos.width === null || datos.height === null || datos.depth === null) {
      this.mensajeError = 'Ingresa las tres dimensiones.';
      return;
    }

    // Estas claves coinciden con validateSpecifications()
    // en PrototypeServiceImpl.

    const specifications: Record<string, unknown> = {
      material: datos.material.trim(),
      color: datos.color.trim(),

      dimensions: {
        width: datos.width,
        height: datos.height,
        depth: datos.depth,
        unit: datos.unit,
      },

      ...(datos.tipoMueble && {
        furnitureType: datos.tipoMueble,
      }),

      ...(datos.style && {
        style: datos.style,
      }),
    };

    const prompt = datos.prompt.trim();

    // Recreación preventiva de la longitud del texto
    // que construye Spring Boot antes de llamar a Cloudflare.
    const especificacionesJson = JSON.stringify(specifications);

    const promptFinal =
      'Referencia visual de producto personalizado. ' +
      prompt +
      '. Especificaciones: ' +
      especificacionesJson;

    if (Array.from(promptFinal).length > 2048 || especificacionesJson.length > 2000) {
      this.mensajeError = 'La descripción y las especificaciones son demasiado extensas.';
      return;
    }

    const solicitud: PrototypeRequest = {
      name: datos.name.trim(),
      categoryId: this.categoriaIdMobiliario,
      prompt,
      specifications,
    };

    this.limpiarResultado();

    this.ejecutar(this.api.generar(solicitud), 'Registrando tu solicitud...');
  }

  // Se utiliza tanto después del POST como para
  // volver a consultar una generación pendiente.

  private ejecutar(solicitud: Observable<PrototypeDTO>, mensaje: string): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeEstado = mensaje;

    solicitud
      .pipe(
        tap((prototipo) => {
          this.prototipo = prototipo;
        }),

        switchMap((prototipo) => this.esperarResultado(prototipo)),

        switchMap((prototipo) => {
          this.prototipo = prototipo;

          if (prototipo.generationStatus === 'ERROR') {
            return throwError(() => new Error(prototipo.error || 'No se pudo generar la imagen.'));
          }

          const imagen = prototipo.images?.find((i) => i.principal) ?? prototipo.images?.[0];

          if (!imagen?.url) {
            return throwError(
              () => new Error('El prototipo se completó, pero no tiene una imagen disponible.'),
            );
          }

          this.mensajeEstado = 'Cargando imagen...';

          return this.api
            .obtenerImagen(prototipo.prototypeId, imagen.url)
            .pipe(map((blob) => ({ prototipo, blob })));
        }),

        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ prototipo, blob }) => {
          console.log('Imagen recibida:', {
            prototypeId: prototipo.prototypeId,
            estado: prototipo.generationStatus,
            tipo: blob.type,
            bytes: blob.size,
          });

          if (!blob.size || !['image/png', 'image/jpeg', 'image/webp'].includes(blob.type)) {
            this.mensajeError = 'El servidor no devolvió una imagen compatible.';
            this.mensajeEstado = '';
            this.cdr.markForCheck();
            return;
          }

          this.imagenUrl = URL.createObjectURL(blob);
          this.prototipo = prototipo;
          this.mensajeEstado = 'Diseño generado correctamente.';

          this.cdr.markForCheck();
        },

        error: (error: unknown) => {
          console.error('Error al obtener imagen:', error);

          this.mensajeError = this.obtenerMensajeError(error);
          this.mensajeEstado = '';

          this.cdr.markForCheck();
        },
      });
  }

  private esperarResultado(inicial: PrototypeDTO): Observable<PrototypeDTO> {
    if (inicial.generationStatus === 'COMPLETADO' || inicial.generationStatus === 'ERROR') {
      return of(inicial);
    }

    this.mensajeEstado = 'La IA está generando tu diseño...';

    return timer(0, 3000).pipe(
      // Evita realizar consultas superpuestas.
      exhaustMap(() => this.api.obtenerPorId(inicial.prototypeId)),

      tap((prototipo) => {
        this.prototipo = prototipo;
        this.mensajeEstado = `Estado de generación: ${prototipo.generationStatus}`;
        this.cdr.markForCheck();
      }),

      filter(
        (prototipo) =>
          prototipo.generationStatus === 'COMPLETADO' || prototipo.generationStatus === 'ERROR',
      ),

      take(1),

      // Espera máxima de la pantalla: 4 minutos.
      timeout({ first: 240000 }),
    );
  }

  consultarEstado(): void {
    if (this.cargando || !this.prototipo?.prototypeId) return;

    this.ejecutar(
      this.api.obtenerPorId(this.prototipo.prototypeId),
      'Consultando el estado del prototipo...',
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (error instanceof TimeoutError) {
      return (
        'La generación todavía no ha finalizado. ' +
        'Puedes volver a consultar su estado sin crear otro prototipo.'
      );
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con el backend.';
      }

      if (error.status === 401) {
        return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
      }

      if (error.status === 403) {
        return 'No tienes permisos para acceder a este prototipo.';
      }

      const detalle = error.error?.message ?? error.error?.detail ?? error.error?.error;

      if (typeof detalle === 'string' && detalle.trim()) {
        return detalle;
      }

      if (error.status === 503 || error.status === 504) {
        return 'El servicio de IA no está disponible.';
      }

      return `Ocurrió un error HTTP ${error.status}.`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Ocurrió un error inesperado.';
  }

  descargarImagen(): void {
    if (!this.imagenUrl) return;

    const enlace = document.createElement('a');

    enlace.href = this.imagenUrl;
    enlace.download = `marketar-${this.prototipo?.prototypeId ?? 'diseno'}.png`;

    enlace.click();
  }

  private limpiarResultado(): void {
    if (this.imagenUrl) {
      URL.revokeObjectURL(this.imagenUrl);
    }

    this.imagenUrl = null;
    this.prototipo = null;
    this.mensajeEstado = '';
    this.mensajeError = '';
  }

  ngOnDestroy(): void {
    if (this.imagenUrl) {
      URL.revokeObjectURL(this.imagenUrl);
    }
  }
}
