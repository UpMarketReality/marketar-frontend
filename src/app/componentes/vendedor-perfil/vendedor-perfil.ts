
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  styleUrl: './vendedor-perfil.css'
})
export class VendedorPerfil implements OnInit {

  // INFORMACION DEL VENDEDOR
  perfil: PerfilVendedor = {
    nombre: 'DomusDecoSAC',
    especialidad: 'Muebles de Melamina',
    descripcion:
      'Somos un taller especializado en el diseño y fabricación de muebles modernos en melamina con más de 3 años de experiencia en el mercado limeño. Nuestro enfoque es la calidad de los acabados y la puntualidad en las entregas.',
    correo: 'contacto@domusdecosac.pe',
    telefono: '(+51) 987 654 321',
    direccion: 'Av. Los Constructores 1234, Santa Anita, Lima',
    instagram: '@domusdecosac',
    facebook: '',
    tiktok: '',
    tiempoFabricacion: '20 a 30 días',
    garantia: '1 año por defectos de fábrica'
  };

  // MENSAJES DEL SISTEMA
  mensaje = '';
  tipoMensaje: 'exito' | 'error' = 'exito';

  // CONTROL DE VISTA PREVIA
  mostrarVistaPrevia = false;

  // IMAGEN DE PORTADA
  portadaUrl: string | null = null;

  // CLAVES DE ALMACENAMIENTO LOCAL
  private readonly clavePerfil = 'marketar-perfil-vendedor';
  private readonly clavePortada = 'marketar-portada-vendedor';

  // TAMAÑO MAXIMO DE IMAGEN: 3 MB
  private readonly tamanoMaximoArchivo = 3 * 1024 * 1024;

  // INICIALES DEL VENDEDOR
  get iniciales(): string {
    const nombre = this.perfil.nombre.trim();

    if (!nombre) {
      return 'DD';
    }

    const palabras = nombre.split(/\s+/);

    if (palabras.length > 1) {
      return (
        palabras[0][0] + palabras[1][0]
      ).toUpperCase();
    }

    return nombre.slice(0, 2).toUpperCase();
  }

  // CARGAR INFORMACION GUARDADA
  ngOnInit(): void {

    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      // RECUPERAR DATOS DEL PERFIL
      const guardado = localStorage.getItem(this.clavePerfil);

      if (guardado) {
        const datos: unknown = JSON.parse(guardado);

        if (
          datos !== null &&
          typeof datos === 'object' &&
          !Array.isArray(datos)
        ) {
          const perfilGuardado = datos as Partial<PerfilVendedor>;

          const claves = Object.keys(this.perfil) as
            (keyof PerfilVendedor)[];

          for (const clave of claves) {
            const valor = perfilGuardado[clave];

            if (typeof valor === 'string') {
              this.perfil[clave] = valor;
            }
          }
        }
      }

      // RECUPERAR PORTADA GUARDADA
      const portadaGuardada = localStorage.getItem(
        this.clavePortada
      );

      if (
        portadaGuardada?.startsWith(
          'data:image/jpeg;base64,'
        )
      ) {
        this.portadaUrl = portadaGuardada;
      }

    } catch {
      this.mostrarError(
        'No se pudieron recuperar todos los datos guardados.'
      );
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
    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!tiposPermitidos.includes(archivo.type)) {
      this.mostrarError(
        'Selecciona una imagen JPG, PNG o WebP.'
      );
      return;
    }

    // VALIDAR TAMAÑO
    if (archivo.size > this.tamanoMaximoArchivo) {
      this.mostrarError(
        'La imagen no debe superar los 3 MB.'
      );
      return;
    }

    // VERIFICAR COMPATIBILIDAD
    if (
      typeof FileReader === 'undefined' ||
      typeof Image === 'undefined'
    ) {
      this.mostrarError(
        'Este navegador no permite procesar la imagen.'
      );
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {

      if (typeof lector.result !== 'string') {
        this.mostrarError(
          'No se pudo leer la imagen.'
        );
        return;
      }

      const imagen = new Image();

      imagen.onload = () => {
        try {

          // REDUCIR EL TAMAÑO DE LA PORTADA
          const maxAncho = 1600;
          const maxAlto = 900;

          const escala = Math.min(
            1,
            maxAncho / imagen.width,
            maxAlto / imagen.height
          );

          const canvas = document.createElement('canvas');

          canvas.width = Math.max(
            1,
            Math.round(imagen.width * escala)
          );

          canvas.height = Math.max(
            1,
            Math.round(imagen.height * escala)
          );

          const contexto = canvas.getContext('2d');

          if (!contexto) {
            this.mostrarError(
              'No se pudo procesar la fotografía.'
            );
            return;
          }

          contexto.drawImage(
            imagen,
            0,
            0,
            canvas.width,
            canvas.height
          );

          // CONVERTIR A JPEG COMPRIMIDO
          this.portadaUrl = canvas.toDataURL(
            'image/jpeg',
            0.75
          );

          this.tipoMensaje = 'exito';

          this.mensaje =
            'Portada lista. Presiona Guardar Cambios para conservarla.';

        } catch {
          this.mostrarError(
            'No se pudo procesar la fotografía.'
          );
        }
      };

      imagen.onerror = () => {
        this.mostrarError(
          'El archivo no contiene una imagen válida.'
        );
      };

      imagen.src = lector.result;
    };

    lector.onerror = () => {
      this.mostrarError(
        'No se pudo cargar la imagen.'
      );
    };

    lector.readAsDataURL(archivo);
  }

  // GUARDAR CAMBIOS
  guardarCambios(): void {

    this.mensaje = '';

    // VALIDAR NOMBRE
    if (!this.perfil.nombre.trim()) {
      this.mostrarError(
        'Ingresa el nombre del taller o empresa.'
      );
      return;
    }

    // VALIDAR ESPECIALIDAD
    if (!this.perfil.especialidad.trim()) {
      this.mostrarError(
        'Ingresa la especialidad principal.'
      );
      return;
    }

    // VALIDAR CORREO
    if (!this.perfil.correo.trim()) {
      this.mostrarError(
        'Ingresa el correo electrónico.'
      );
      return;
    }

    const correoValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(this.perfil.correo.trim())) {
      this.mostrarError(
        'Ingresa un correo electrónico válido.'
      );
      return;
    }

    // VERIFICAR ALMACENAMIENTO
    if (typeof localStorage === 'undefined') {
      this.mostrarError(
        'El almacenamiento local no está disponible.'
      );
      return;
    }

    // GUARDAR INFORMACION Y PORTADA
    try {

      if (this.portadaUrl) {
        localStorage.setItem(
          this.clavePortada,
          this.portadaUrl
        );
      }

      localStorage.setItem(
        this.clavePerfil,
        JSON.stringify(this.perfil)
      );

      this.tipoMensaje = 'exito';

      this.mensaje =
        'Perfil y portada guardados correctamente en este navegador.';

    } catch {
      this.mostrarError(
        'No se pudieron guardar todos los cambios. El navegador puede tener poco espacio disponible.'
      );
    }
  }

  // MOSTRAR MENSAJES DE ERROR
  private mostrarError(texto: string): void {
    this.tipoMensaje = 'error';
    this.mensaje = texto;
  }
}
