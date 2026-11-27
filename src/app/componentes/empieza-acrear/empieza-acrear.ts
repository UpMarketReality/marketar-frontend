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
import { CatalogService } from '../../services/catalog-service';
import { CategoryDTO } from '../../model/category-dto';

interface ConfigCategoria {
  etiquetaTipo: string;
  tipos: string[];
  estilos: string[];
  materiales: string[];
  tecnicas: string[];
}

@Component({
  selector: 'app-empieza-acrear',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './empieza-acrear.html',
  styleUrl: './empieza-acrear.css',
})
export class EmpiezaACrear implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PrototypeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly catalogService = inject(CatalogService);

  categorias: CategoryDTO[] = [];
  cargandoCategorias = true;
  errorCategorias = '';

  readonly configuraciones: Partial<Record<string, ConfigCategoria>> = {
    MOBILIARIO: {
      etiquetaTipo: 'Tipo de mueble',

      tipos: ['Mesa', 'Cama', 'Sofá', 'Escritorio', 'Armario', 'Cómoda'],

      estilos: ['Moderno', 'Minimalista', 'Industrial', 'Rústico', 'Vintage'],

      materiales: ['Madera', 'Metal', 'Plástico', 'Bambú', 'Vidrio', 'Otro'],

      tecnicas: [],
    },

    CERAMICA: {
      etiquetaTipo: 'Tipo de cerámica',

      tipos: ['Taza', 'Plato', 'Jarrón', 'Maceta', 'Cuenco', 'Jarra'],

      estilos: ['Artesanal', 'Minimalista', 'Rústico', 'Moderno', 'Floral'],

      materiales: ['Arcilla', 'Porcelana', 'Gres', 'Terracota', 'Otro'],

      tecnicas: ['Pintado a mano', 'Esmaltado', 'Grabado'],
    },

    TEXTIL: {
      etiquetaTipo: 'Tipo de textil',

      tipos: ['Polo', 'Sudadera', 'Camisa', 'Bolso', 'Cojín', 'Manta'],

      estilos: ['Casual', 'Minimalista', 'Urbano', 'Elegante', 'Vintage'],

      materiales: ['Algodón', 'Lino', 'Lana', 'Poliéster', 'Seda', 'Otro'],

      tecnicas: ['Bordado', 'Estampado', 'Sublimación', 'Tejido'],
    },
  };

  readonly tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  readonly formulario = this.fb.group({
    categoryId: this.fb.control<number | null>(null, [Validators.required]),

    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),

    prompt: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(500),
    ]),

    productType: this.fb.nonNullable.control(''),

    style: this.fb.nonNullable.control(''),

    material: this.fb.nonNullable.control('', [Validators.required]),

    color: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),

    technique: this.fb.nonNullable.control(''),

    // CAMPOS EXCLUSIVOS DE MOBILIARIO

    width: this.fb.control<number | null>({ value: null, disabled: true }, [
      Validators.required,
      Validators.min(0.01),
    ]),

    height: this.fb.control<number | null>({ value: null, disabled: true }, [
      Validators.required,
      Validators.min(0.01),
    ]),

    depth: this.fb.control<number | null>({ value: null, disabled: true }, [
      Validators.required,
      Validators.min(0.01),
    ]),

    unit: this.fb.nonNullable.control<'mm' | 'cm' | 'm'>({ value: 'cm', disabled: true }),

    // CAMPO EXCLUSIVO DE CERÁMICA

    capacityMl: this.fb.control<number | null>({ value: null, disabled: true }, [
      Validators.min(1),
    ]),

    // CAMPO EXCLUSIVO DE TEXTILES

    size: this.fb.nonNullable.control({ value: '', disabled: true }),
  });

  cargando = false;
  mensajeEstado = '';
  mensajeError = '';

  prototipo: PrototypeDTO | null = null;
  imagenUrl: string | null = null;

  ngOnInit(): void {
    this.formulario.controls.categoryId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.actualizarCamposCategoria();
      });

    this.formulario.controls.productType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.actualizarCamposProducto();
      });

    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.cargandoCategorias = true;
    this.errorCategorias = '';

    this.catalogService
      .getPrototypeCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargandoCategorias = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (categorias) => {
          this.categorias = categorias;

          if (!this.categoriaSeleccionada) {
            this.formulario.controls.categoryId.reset(null);
          }

          if (categorias.length === 0) {
            this.errorCategorias = 'No hay categorías disponibles.';
          }
        },

        error: () => {
          this.categorias = [];
          this.formulario.controls.categoryId.reset(null);

          this.errorCategorias = 'No se pudieron cargar las categorías.';
        },
      });
  }

  private actualizarCamposCategoria(): void {
    const controls = this.formulario.controls;

    // Limpiar filtros de la categoría anterior.

    controls.productType.reset('', { emitEvent: false });
    controls.style.reset('');
    controls.material.reset('');
    controls.technique.reset('');

    // Reiniciar dimensiones.

    const dimensiones = [controls.width, controls.height, controls.depth];

    for (const control of dimensiones) {
      control.reset(null);

      if (this.esMobiliario) {
        control.enable();
      } else {
        control.disable();
      }
    }

    controls.unit.reset('cm');

    if (this.esMobiliario) {
      controls.unit.enable();
    } else {
      controls.unit.disable();
    }

    this.actualizarCamposProducto();

    this.mensajeError = '';
  }

  private actualizarCamposProducto(): void {
    const controls = this.formulario.controls;

    // Capacidad para determinados productos cerámicos.

    controls.capacityMl.reset(null);

    if (this.mostrarCapacidad) {
      controls.capacityMl.enable();
    } else {
      controls.capacityMl.disable();
    }

    // Talla únicamente para prendas de vestir.

    controls.size.reset('');

    if (this.mostrarTalla) {
      controls.size.enable();
    } else {
      controls.size.disable();
    }
  }

  get categoriaSeleccionada(): CategoryDTO | undefined {
    return this.categorias.find(
      (categoria) => categoria.categoryId === this.formulario.controls.categoryId.value,
    );
  }

  get tipoCategoria(): string {
    return this.categoriaSeleccionada?.type ?? '';
  }

  get configCategoria(): ConfigCategoria | undefined {
    return this.configuraciones[this.tipoCategoria];
  }

  get tiposProducto(): string[] {
    return this.configCategoria?.tipos ?? [];
  }

  get estilos(): string[] {
    return this.configCategoria?.estilos ?? [];
  }

  get materiales(): string[] {
    return this.configCategoria?.materiales ?? [];
  }

  get tecnicas(): string[] {
    return this.configCategoria?.tecnicas ?? [];
  }

  get esMobiliario(): boolean {
    return this.tipoCategoria === 'MOBILIARIO';
  }

  get esCeramica(): boolean {
    return this.tipoCategoria === 'CERAMICA';
  }

  get esTextil(): boolean {
    return this.tipoCategoria === 'TEXTIL';
  }

  get mostrarCapacidad(): boolean {
    return (
      this.esCeramica &&
      ['Taza', 'Jarra', 'Cuenco'].includes(this.formulario.controls.productType.value)
    );
  }

  get mostrarTalla(): boolean {
    return (
      this.esTextil &&
      ['Polo', 'Sudadera', 'Camisa'].includes(this.formulario.controls.productType.value)
    );
  }

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

  seleccionarFiltro(
    campo: 'productType' | 'style' | 'material' | 'technique',
    valor: string,
  ): void {
    const control = this.formulario.controls[campo];

    control.setValue(control.value === valor ? '' : valor);

    control.markAsTouched();
  }

  generarDiseno(): void {
    if (this.cargando || this.cargandoCategorias) return;

    this.mensajeError = '';

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      this.mensajeError = 'Completa correctamente los campos obligatorios.';

      return;
    }

    const datos = this.formulario.getRawValue();

    const categoriaSeleccionada = this.categoriaSeleccionada;

    if (!categoriaSeleccionada?.categoryId || !this.configCategoria) {
      this.mensajeError = 'Selecciona una categoría válida.';

      return;
    }

    const prompt = datos.prompt.trim();

    // Validar cadenas vacías o espacios.

    if (!datos.name.trim() || prompt.length < 10 || !datos.material.trim() || !datos.color.trim()) {
      this.mensajeError = 'Revisa el nombre, la descripción, el material y el color.';

      return;
    }

    // ESPECIFICACIONES COMUNES

    const specifications: Record<string, unknown> = {
      category: categoriaSeleccionada.name ?? this.tipoCategoria,

      material: datos.material.trim(),

      color: datos.color.trim(),

      ...(datos.style && {
        style: datos.style,
      }),
    };

    // MOBILIARIO

    if (this.esMobiliario) {
      if (datos.width === null || datos.height === null || datos.depth === null) {
        this.mensajeError = 'Ingresa las tres dimensiones.';

        return;
      }

      specifications['dimensions'] = {
        width: datos.width,
        height: datos.height,
        depth: datos.depth,
        unit: datos.unit,
      };

      if (datos.productType) {
        specifications['furnitureType'] = datos.productType;
      }
    }

    // CERÁMICA

    if (this.esCeramica) {
      if (datos.productType) {
        specifications['productType'] = datos.productType;
      }

      if (this.mostrarCapacidad && datos.capacityMl !== null) {
        specifications['capacityMl'] = datos.capacityMl;
      }

      if (datos.technique) {
        specifications['technique'] = datos.technique;
      }
    }

    // TEXTILES

    if (this.esTextil) {
      if (datos.productType) {
        specifications['productType'] = datos.productType;
      }

      if (this.mostrarTalla && datos.size) {
        specifications['size'] = datos.size;
      }

      if (datos.technique) {
        specifications['technique'] = datos.technique;
      }
    }

    // VALIDAR LONGITUD DEL PROMPT FINAL

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

    // SOLICITUD AL BACKEND

    const solicitud: PrototypeRequest = {
      name: datos.name.trim(),

      categoryId: categoriaSeleccionada.categoryId,

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
