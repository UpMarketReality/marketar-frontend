import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog-service';
import { AuthService } from '../../core/auth/auth.service';
import { StoreDTO } from '../../model/store-dto';
import { StoreRequest } from '../../model/store-request';

interface PerfilVendedor {
  nombre: string;
  especialidad: string;
  descripcion: string;
  correo: string;
  telefono: string;
  direccion: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  tiempoFabricacion: string;
  garantia: string;
}

@Component({
  selector: 'app-vendedor-perfil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './vendedor-perfil.html',
  styleUrl: './vendedor-perfil.css',
})
export class VendedorPerfil implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  // INFORMACION DEL VENDEDOR (se llena desde la API y el almacenamiento del vendedor)
  perfil: PerfilVendedor = {
    nombre: '',
    especialidad: '',
    descripcion: '',
    correo: this.authService.getUser()?.email ?? '',
    telefono: '',
    direccion: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    tiempoFabricacion: '',
    garantia: '',
  };

  // MENSAJES DEL SISTEMA
  mensaje = '';
  tipoMensaje: 'exito' | 'error' = 'exito';

  // CONTROL DE ENVIO
  guardando = false;

  // CONTROL DE VISTA PREVIA
  mostrarVistaPrevia = false;

  // IMAGEN DE PORTADA
  portadaUrl: string | null = null;

  // TAMAÑO MAXIMO DE IMAGEN: 3 MB
  private readonly tamanoMaximoArchivo = 3 * 1024 * 1024;

  // LIMITES DE LA TIENDA (igual que el backend)
  private readonly maximoNombre = 100;
  private readonly maximoDescripcion = 500;

  // IDENTIFICADOR DEL VENDEDOR EN SESIÓN (para separar sus datos de otros vendedores)
  private get idUsuario(): string {
    return this.authService.getUser()?.userId ?? 'sin-sesion';
  }

  // CLAVES DE ALMACENAMIENTO LOCAL POR VENDEDOR
  private get clavePerfil(): string {
    return `marketar-perfil-vendedor-${this.idUsuario}`;
  }

  private get clavePortada(): string {
    return `marketar-portada-vendedor-${this.idUsuario}`;
  }

  // INICIALES DEL VENDEDOR
  get iniciales(): string {
    const nombre = this.perfil.nombre.trim();

    if (!nombre) {
      return 'DD';
    }

    const palabras = nombre.split(/\s+/);

    if (palabras.length > 1) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }

    return nombre.slice(0, 2).toUpperCase();
  }

  // CARGAR INFORMACION GUARDADA
  ngOnInit(): void {
    // Nombre y descripción vienen de la API (US11)
    this.cargarTienda();

    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      // RECUPERAR DATOS DEL PERFIL
      const guardado = localStorage.getItem(this.clavePerfil);

      if (guardado) {
        const datos: unknown = JSON.parse(guardado);

        if (datos !== null && typeof datos === 'object' && !Array.isArray(datos)) {
          const perfilGuardado = datos as Partial<PerfilVendedor>;

          const claves = Object.keys(this.perfil) as (keyof PerfilVendedor)[];

          for (const clave of claves) {
            // NOMBRE Y DESCRIPCIÓN VIENEN DE LA API
            if (clave === 'nombre' || clave === 'descripcion') {
              continue;
            }

            const valor = perfilGuardado[clave];

            if (typeof valor === 'string') {
              this.perfil[clave] = valor;
            }
          }
        }
      }

      // RECUPERAR PORTADA GUARDADA
      const portadaGuardada = localStorage.getItem(this.clavePortada);

      if (portadaGuardada?.startsWith('data:image/jpeg;base64,')) {
        this.portadaUrl = portadaGuardada;
      }
    } catch {
      this.mostrarError('No se pudieron recuperar todos los datos guardados.');
    }
  }

  // ABRIR VISTA PREVIA
  verMiTienda(): void {
    this.mostrarVistaPrevia = true;
    this.mensaje = '';
  }

  // CERRAR VISTA PREVIA
  cerrarVistaPrevia(): void {
    this.mostrarVistaPrevia = false;
  }

  // ALTERNAR VISTA PREVIA
  alternarVistaPrevia(): void {
    if (this.mostrarVistaPrevia) {
      this.cerrarVistaPrevia();
    } else {
      this.verMiTienda();
    }
  }

  // CAMBIAR IMAGEN DE PORTADA
  cambiarPortada(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    input.value = '';

    // VALIDAR TIPO DE IMAGEN
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (!tiposPermitidos.includes(archivo.type)) {
      this.mostrarError('Selecciona una imagen JPG, PNG o WebP.');
      return;
    }

    // VALIDAR TAMAÑO
    if (archivo.size > this.tamanoMaximoArchivo) {
      this.mostrarError('La imagen no debe superar los 3 MB.');
      return;
    }

    // VERIFICAR COMPATIBILIDAD
    if (typeof FileReader === 'undefined' || typeof Image === 'undefined') {
      this.mostrarError('Este navegador no permite procesar la imagen.');
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {
      if (typeof lector.result !== 'string') {
        this.mostrarError('No se pudo leer la imagen.');
        return;
      }

      const imagen = new Image();

      imagen.onload = () => {
        try {
          // REDUCIR EL TAMAÑO DE LA PORTADA
          const maxAncho = 1600;
          const maxAlto = 900;

          const escala = Math.min(1, maxAncho / imagen.width, maxAlto / imagen.height);

          const canvas = document.createElement('canvas');

          canvas.width = Math.max(1, Math.round(imagen.width * escala));

          canvas.height = Math.max(1, Math.round(imagen.height * escala));

          const contexto = canvas.getContext('2d');

          if (!contexto) {
            this.mostrarError('No se pudo procesar la fotografía.');
            return;
          }

          contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

          // CONVERTIR A JPEG COMPRIMIDO
          this.portadaUrl = canvas.toDataURL('image/jpeg', 0.75);

          this.tipoMensaje = 'exito';

          this.mensaje = 'Portada lista. Presiona Guardar Cambios para conservarla.';

          this.cdr.markForCheck();
        } catch {
          this.mostrarError('No se pudo procesar la fotografía.');
        }
      };

      imagen.onerror = () => {
        this.mostrarError('El archivo no contiene una imagen válida.');
      };

      imagen.src = lector.result;
    };

    lector.onerror = () => {
      this.mostrarError('No se pudo cargar la imagen.');
    };

    lector.readAsDataURL(archivo);
  }

  // GUARDAR CAMBIOS
  guardarCambios(): void {
    this.mensaje = '';

    if (this.guardando) {
      return;
    }

    // VALIDAR NOMBRE
    if (!this.perfil.nombre.trim()) {
      this.mostrarError('Ingresa el nombre del taller o empresa.');
      return;
    }

    if (this.perfil.nombre.trim().length > this.maximoNombre) {
      this.mostrarError(`El nombre no debe superar ${this.maximoNombre} caracteres.`);
      return;
    }

    // VALIDAR DESCRIPCION
    if (this.perfil.descripcion.trim().length > this.maximoDescripcion) {
      this.mostrarError(`La descripción no debe superar ${this.maximoDescripcion} caracteres.`);
      return;
    }

    // VALIDAR ESPECIALIDAD
    if (!this.perfil.especialidad.trim()) {
      this.mostrarError('Ingresa la especialidad principal.');
      return;
    }

    // VALIDAR CORREO
    if (!this.perfil.correo.trim()) {
      this.mostrarError('Ingresa el correo electrónico.');
      return;
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(this.perfil.correo.trim())) {
      this.mostrarError('Ingresa un correo electrónico válido.');
      return;
    }

    // VERIFICAR ALMACENAMIENTO
    if (typeof localStorage === 'undefined') {
      this.mostrarError('El almacenamiento local no está disponible.');
      return;
    }

    // ENVIAR NOMBRE Y DESCRIPCION A LA API: PUT /api/v1/seller/store
    const datos: StoreRequest = {
      storeName: this.perfil.nombre.trim(),
      storeDescription: this.perfil.descripcion.trim(),
    };

    this.guardando = true;

    this.catalogService.updateStore(datos).subscribe({
      next: (tienda: StoreDTO) => {
        this.guardando = false;
        this.perfil.nombre = tienda.storeName ?? this.perfil.nombre;
        this.perfil.descripcion = tienda.storeDescription ?? '';
        this.guardarDatosLocales();
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.mostrarError(
          error.error?.message ?? 'No se pudo guardar la información de la tienda.',
        );
      },
    });
  }

  // GUARDAR EN ESTE NAVEGADOR LOS DATOS QUE NO VIENEN DE LA API
  private guardarDatosLocales(): void {
    try {
      if (this.portadaUrl) {
        localStorage.setItem(this.clavePortada, this.portadaUrl);
      }

      // NOMBRE Y DESCRIPCIÓN NO SE GUARDAN AQUÍ: LOS MANEJA LA API
      const datosLocales: Partial<PerfilVendedor> = { ...this.perfil };
      delete datosLocales.nombre;
      delete datosLocales.descripcion;

      localStorage.setItem(this.clavePerfil, JSON.stringify(datosLocales));

      this.tipoMensaje = 'exito';

      this.mensaje = 'Tienda actualizada correctamente.';
    } catch {
      this.mostrarError(
        'La tienda se actualizó, pero no se pudo guardar el resto del perfil en este navegador.',
      );
    }
  }

  // CONSULTAR NOMBRE Y DESCRIPCIÓN DE LA TIENDA: GET /api/v1/seller/store
  private cargarTienda(): void {
    this.catalogService.getStore().subscribe({
      next: (tienda) => {
        this.perfil.nombre = tienda.storeName ?? '';
        this.perfil.descripcion = tienda.storeDescription ?? '';
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.mostrarError(error.error?.message ?? 'No se pudo cargar la información de la tienda.');
      },
    });
  }

  // MOSTRAR MENSAJES DE ERROR
  private mostrarError(texto: string): void {
    this.tipoMensaje = 'error';
    this.mensaje = texto;
    this.cdr.markForCheck();
  }
}
