
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

type EstadoCotizacion =
  | 'Nueva Solicitud'
  | 'Enviada'
  | 'Aceptada'
  | 'Rechazada';

type PestanaCotizacion =
  | 'nuevas'
  | 'enviadas'
  | 'aceptadas'
  | 'rechazadas';

type PestanaPrincipal = 'cotizaciones' | 'finanzas';
type PestanaFinanzas = 'movimientos' | 'retiros';

interface Cotizacion {
  id: string;
  cliente: string;
  iniciales: string;
  proyecto: string;
  fecha: string;
  estado: EstadoCotizacion;
  precio: number;
  diasFabricacion: number;
  condiciones: string;
}

interface Movimiento {
  fecha: string;
  concepto: string;
  referencia: string;
  monto: number;
  estado: string;
  tipo: 'ingreso' | 'comision' | 'retiro';
}

@Component({
  selector: 'app-vendedor-cotizaciones',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './vendedor-cotizaciones.html',
  styleUrl: './vendedor-cotizaciones.css'
})
export class VendedorCotizaciones implements OnInit {

  // NAVEGACION PRINCIPAL
  pestanaPrincipal: PestanaPrincipal = 'cotizaciones';
  pestanaCotizacion: PestanaCotizacion = 'nuevas';
  pestanaFinanzas: PestanaFinanzas = 'movimientos';

  // MENSAJES
  mensaje = '';
  tipoMensaje: 'exito' | 'error' = 'exito';

  // FORMULARIOS DE COTIZACION
  precioEstimado: number | null = null;
  diasFabricacion: number | null = null;
  condiciones = '';

  // NUEVA PROPUESTA
  mostrarNuevaPropuesta = false;
  nuevoCliente = '';
  nuevoProyecto = '';

  // ALMACENAMIENTO LOCAL
  private readonly claveDatos = 'marketar-mar12-vendedor-v1';

  // SOLICITUDES DE DEMOSTRACION
  cotizaciones: Cotizacion[] = [
    {
      id: 'CQ-1042',
      cliente: 'María Castro',
      iniciales: 'MC',
      proyecto: 'Mesa de centro a medida',
      fecha: 'Hoy, 10:30 AM',
      estado: 'Nueva Solicitud',
      precio: 0,
      diasFabricacion: 0,
      condiciones: ''
    },
    {
      id: 'CQ-1041',
      cliente: 'Luis Torres',
      iniciales: 'LT',
      proyecto: 'Sillón 3 cuerpos (Modif.)',
      fecha: 'Ayer, 16:45 PM',
      estado: 'Nueva Solicitud',
      precio: 0,
      diasFabricacion: 0,
      condiciones: ''
    },
    {
      id: 'CQ-1040',
      cliente: 'Juan Pérez',
      iniciales: 'JP',
      proyecto: 'Armario de melamina',
      fecha: '20 Oct, 09:30 AM',
      estado: 'Enviada',
      precio: 2400,
      diasFabricacion: 20,
      condiciones: 'Incluye instalación.'
    },
    {
      id: 'CQ-1039',
      cliente: 'Ana Rojas',
      iniciales: 'AR',
      proyecto: 'Escritorio personalizado',
      fecha: '19 Oct, 11:20 AM',
      estado: 'Aceptada',
      precio: 1450,
      diasFabricacion: 15,
      condiciones: 'Entrega coordinada.'
    },
    {
      id: 'CQ-1038',
      cliente: 'Carlos Mendoza',
      iniciales: 'CM',
      proyecto: 'Mueble de cocina',
      fecha: '18 Oct, 15:00 PM',
      estado: 'Rechazada',
      precio: 0,
      diasFabricacion: 0,
      condiciones: ''
    }
  ];

  cotizacionSeleccionada: Cotizacion | null = null;

  // INDICADORES FINANCIEROS DE DEMOSTRACION
  disponibleRetiro = 4250;
  enTransito = 2400;
  ventasBrutas = 15000;
  comisionesPagadas = 750;

  // MOVIMIENTOS DE DEMOSTRACION
  movimientos: Movimiento[] = [
    {
      fecha: 'Hoy, 14:30',
      concepto: 'Venta de Mueble',
      referencia: 'MK-9021',
      monto: 2400,
      estado: 'En Tránsito',
      tipo: 'ingreso'
    },
    {
      fecha: 'Hoy, 14:30',
      concepto: 'Comisión MarketAR (5%)',
      referencia: 'MK-9021',
      monto: -120,
      estado: 'Cobrado',
      tipo: 'comision'
    },
    {
      fecha: '22 Oct, 09:15',
      concepto: 'Retiro a Cuenta',
      referencia: 'TRX-88902',
      monto: -5500,
      estado: 'Completado',
      tipo: 'retiro'
    },
    {
      fecha: '18 Oct, 11:20',
      concepto: 'Venta de Mueble',
      referencia: 'MK-8944',
      monto: 1450,
      estado: 'Acreditado',
      tipo: 'ingreso'
    },
    {
      fecha: '18 Oct, 11:20',
      concepto: 'Comisión MarketAR (5%)',
      referencia: 'MK-8944',
      monto: -72.50,
      estado: 'Cobrado',
      tipo: 'comision'
    }
  ];

  // RETIROS
  montoRetirar: number | null = null;
  mostrarFormularioRetiro = false;
  retiroSolicitado = false;

  // INICIALIZACION
  ngOnInit(): void {
    this.recuperarDatos();

    const primera = this.cotizaciones.find(
      c => c.estado === 'Nueva Solicitud'
    );

    if (primera) {
      this.seleccionarCotizacion(primera);
    }
  }

  // CAMBIAR PESTAÑA PRINCIPAL
  cambiarPrincipal(pestana: PestanaPrincipal): void {
    this.pestanaPrincipal = pestana;
    this.mensaje = '';
  }

  // CAMBIAR CATEGORIA DE COTIZACIONES
  cambiarCotizacion(pestana: PestanaCotizacion): void {
    this.pestanaCotizacion = pestana;
    this.mensaje = '';

    const primera = this.cotizacionesFiltradas[0];

    if (primera) {
      this.seleccionarCotizacion(primera);
    } else {
      this.cotizacionSeleccionada = null;
      this.limpiarFormulario();
    }
  }

  // CAMBIAR PESTAÑA FINANCIERA
  cambiarFinanzas(pestana: PestanaFinanzas): void {
    this.pestanaFinanzas = pestana;
    this.mensaje = '';
  }

  // TITULO UNICO DE COTIZACIONES
  get tituloCotizaciones(): string {
    const titulos: Record<PestanaCotizacion, string> = {
      nuevas: 'Nuevas Solicitudes',
      enviadas: 'Cotizaciones Enviadas',
      aceptadas: 'Cotizaciones Aceptadas',
      rechazadas: 'Cotizaciones Rechazadas'
    };

    return titulos[this.pestanaCotizacion];
  }

  // FILTRAR SOLICITUDES
  get cotizacionesFiltradas(): Cotizacion[] {
    const estados: Record<
      PestanaCotizacion,
      EstadoCotizacion
    > = {
      nuevas: 'Nueva Solicitud',
      enviadas: 'Enviada',
      aceptadas: 'Aceptada',
      rechazadas: 'Rechazada'
    };

    return this.cotizaciones.filter(
      c => c.estado === estados[this.pestanaCotizacion]
    );
  }

  // CONTAR SOLICITUDES
  contar(estado: EstadoCotizacion): number {
    return this.cotizaciones.filter(
      c => c.estado === estado
    ).length;
  }

  // SELECCIONAR UNA SOLICITUD
  seleccionarCotizacion(cotizacion: Cotizacion): void {
    this.cotizacionSeleccionada = cotizacion;
    this.precioEstimado = cotizacion.precio || null;
    this.diasFabricacion = cotizacion.diasFabricacion || null;
    this.condiciones = cotizacion.condiciones;
  }

  // LIMPIAR FORMULARIO
  private limpiarFormulario(): void {
    this.precioEstimado = null;
    this.diasFabricacion = null;
    this.condiciones = '';
  }

  // ENVIAR COTIZACION
  enviarCotizacion(): void {
    const cotizacion = this.cotizacionSeleccionada;

    if (!cotizacion) {
      this.mostrarError('Selecciona una solicitud.');
      return;
    }

    if (cotizacion.estado !== 'Nueva Solicitud') {
      this.mostrarError('Esta solicitud ya fue procesada.');
      return;
    }

    // VALIDAR PRECIO
    if (
      this.precioEstimado === null ||
      !Number.isFinite(this.precioEstimado) ||
      this.precioEstimado <= 0
    ) {
      this.mostrarError(
        'Ingresa un precio válido mayor a cero.'
      );
      return;
    }

    // VALIDAR DIAS DE FABRICACION
    if (
      this.diasFabricacion === null ||
      !Number.isInteger(this.diasFabricacion) ||
      this.diasFabricacion <= 0
    ) {
      this.mostrarError(
        'Ingresa los días de fabricación.'
      );
      return;
    }

    // CREAR UNA COPIA ACTUALIZADA
    const actualizada: Cotizacion = {
      ...cotizacion,
      precio: this.precioEstimado,
      diasFabricacion: this.diasFabricacion,
      condiciones: this.condiciones.trim(),
      estado: 'Enviada'
    };

    // ACTUALIZAR LA LISTA SIN RECARGAR F5
    this.cotizaciones = this.cotizaciones.map(c =>
      c.id === cotizacion.id ? actualizada : c
    );

    // CAMBIAR A ENVIADAS
    this.pestanaCotizacion = 'enviadas';
    this.seleccionarCotizacion(actualizada);

    this.guardarDatos();

    this.mostrarExito(
      'Cotización enviada correctamente (simulación).'
    );
  }

  // DECLINAR SOLICITUD
  declinarCotizacion(): void {
    const cotizacion = this.cotizacionSeleccionada;

    if (
      !cotizacion ||
      cotizacion.estado !== 'Nueva Solicitud'
    ) {
      this.mostrarError(
        'Selecciona una solicitud nueva.'
      );
      return;
    }

    const confirmar = window.confirm(
      '¿Deseas rechazar la solicitud ' +
      cotizacion.id + '?'
    );

    if (!confirmar) {
      return;
    }

    const actualizada: Cotizacion = {
      ...cotizacion,
      estado: 'Rechazada'
    };

    this.cotizaciones = this.cotizaciones.map(c =>
      c.id === cotizacion.id ? actualizada : c
    );

    this.pestanaCotizacion = 'rechazadas';
    this.seleccionarCotizacion(actualizada);

    this.guardarDatos();

    this.mostrarExito(
      'Solicitud rechazada correctamente.'
    );
  }

  // ABRIR NUEVA PROPUESTA
  abrirNuevaPropuesta(): void {
    this.mostrarNuevaPropuesta = true;
    this.nuevoCliente = '';
    this.nuevoProyecto = '';
    this.mensaje = '';
  }

  // CERRAR NUEVA PROPUESTA
  cerrarNuevaPropuesta(): void {
    this.mostrarNuevaPropuesta = false;
  }

  // CREAR NUEVA PROPUESTA
  crearNuevaPropuesta(): void {
    const cliente = this.nuevoCliente.trim();
    const proyecto = this.nuevoProyecto.trim();

    if (!cliente || !proyecto) {
      this.mostrarError(
        'Completa el cliente y el proyecto.'
      );
      return;
    }

    const mayorId = Math.max(
      1042,
      ...this.cotizaciones.map(
        c => Number(c.id.split('-')[1]) || 0
      )
    );

    const iniciales = cliente
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase();

    const nueva: Cotizacion = {
      id: 'CQ-' + (mayorId + 1),
      cliente,
      iniciales,
      proyecto,
      fecha: new Date().toLocaleString('es-PE'),
      estado: 'Nueva Solicitud',
      precio: 0,
      diasFabricacion: 0,
      condiciones: ''
    };

    this.cotizaciones = [
      nueva,
      ...this.cotizaciones
    ];

    this.mostrarNuevaPropuesta = false;
    this.pestanaPrincipal = 'cotizaciones';
    this.pestanaCotizacion = 'nuevas';

    this.seleccionarCotizacion(nueva);
    this.guardarDatos();

    this.mostrarExito(
      'Nueva propuesta creada como borrador de demostración.'
    );
  }

  // FORMATO DE MONTOS
  formatearMonto(monto: number): string {
    const signo = monto < 0 ? '-' : '+';

    return signo + ' S/ ' +
      Math.abs(monto).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
  }

  // ABRIR RETIRO
  abrirRetiro(): void {
    this.mostrarFormularioRetiro = true;
    this.montoRetirar = this.disponibleRetiro;
    this.mensaje = '';
  }

  // CANCELAR RETIRO
  cancelarRetiro(): void {
    this.mostrarFormularioRetiro = false;
    this.montoRetirar = null;
  }

  // SOLICITAR RETIRO SIMULADO
  solicitarRetiro(): void {
    const monto = this.montoRetirar;

    // VALIDAR MONTO
    if (
      monto === null ||
      !Number.isFinite(monto) ||
      monto <= 0 ||
      Math.round(monto * 100) / 100 !== monto
    ) {
      this.mostrarError(
        'Ingresa un monto de retiro válido, con máximo dos decimales.'
      );
      return;
    }

    if (monto > this.disponibleRetiro) {
      this.mostrarError(
        'El monto supera el saldo disponible.'
      );
      return;
    }

    const confirmar = window.confirm(
      '¿Registrar una solicitud de retiro simulada por S/ ' +
      monto.toFixed(2) + '?'
    );

    if (!confirmar) {
      return;
    }

    // ACTUALIZAR SALDO
    this.disponibleRetiro =
      Math.round(
        (this.disponibleRetiro - monto) * 100
      ) / 100;

    this.retiroSolicitado = true;

    // REGISTRAR MOVIMIENTO
    this.movimientos = [
      {
        fecha: new Date().toLocaleString('es-PE'),
        concepto: 'Solicitud de Retiro (Demo)',
        referencia: 'TRX-' + Date.now(),
        monto: -monto,
        estado: 'Pendiente',
        tipo: 'retiro'
      },
      ...this.movimientos
    ];

    this.cancelarRetiro();
    this.guardarDatos();

    this.mostrarExito(
      'Retiro simulado registrado. No se ha transferido dinero.'
    );
  }

  // EXPORTAR CSV PARA EXCEL EN ESPAÑOL
  exportarCSV(): void {
    const filas = [
      [
        'Fecha',
        'Concepto',
        'Referencia',
        'Monto',
        'Estado'
      ],
      ...this.movimientos.map(m => [
        m.fecha,
        m.concepto,
        m.referencia,
        m.monto.toFixed(2).replace('.', ','),
        m.estado
      ])
    ];

    const escapar = (valor: string): string => {
      // EVITA FORMULAS NO DESEADAS EN EXCEL
      const seguro =
        /^[\s]*[=+@\-\t\r]/.test(valor) &&
          !/^-?\d+(?:,\d+)?$/.test(valor)
          ? "'" + valor
          : valor;

      return '"' +
        seguro.replace(/"/g, '""') +
        '"';
    };

    // SEP INDICA A EXCEL QUE USE ;
    const contenido =
      '\uFEFFsep=;\r\n' +
      filas
        .map(fila =>
          fila
            .map(v => escapar(String(v)))
            .join(';')
        )
        .join('\r\n');

    const blob = new Blob([contenido], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = 'marketar-movimientos-demo.csv';

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    this.mostrarExito(
      'CSV generado para Excel (separado por columnas).'
    );
  }

  // REPORTE FINANCIERO DE DEMOSTRACION
  reporteFiscal(): void {

    // ESCAPAR DATOS MOSTRADOS EN HTML
    const escaparHtml = (valor: string): string =>
      valor
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const dinero = (valor: number): string =>
      'S/ ' + valor.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

    const filas = this.movimientos.map(m => `
      <tr>
        <td>${escaparHtml(m.fecha)}</td>
        <td>${escaparHtml(m.concepto)}</td>
        <td>${escaparHtml(m.referencia)}</td>
        <td class="numero">
          ${escaparHtml(this.formatearMonto(m.monto))}
        </td>
        <td>${escaparHtml(m.estado)}</td>
      </tr>
    `).join('');

    const contenido = `
      <!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>
          MarketAR - Reporte financiero de demostración
        </title>

        <style>
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            font-family: Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            font-size: 11px;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 22px;
          }

          h2 {
            margin-top: 26px;
            font-size: 15px;
          }

          .marca {
            color: #00a99d;
            font-weight: bold;
            letter-spacing: 1px;
          }

          .aviso {
            padding: 10px;
            background: #f1f5f9;
            border-left: 3px solid #00bfb3;
            line-height: 1.5;
          }

          .resumen {
            display: flex;
            gap: 10px;
            margin: 18px 0;
          }

          .indicador {
            flex: 1;
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
          }

          .indicador small {
            display: block;
            color: #64748b;
            margin-bottom: 6px;
          }

          .indicador strong {
            font-size: 15px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th {
            background: #edf2f7;
            text-align: left;
          }

          th, td {
            border-bottom: 1px solid #e2e8f0;
            padding: 9px 6px;
          }

          tr {
            break-inside: avoid;
          }

          .numero {
            white-space: nowrap;
          }

          footer {
            margin-top: 24px;
            font-size: 10px;
            color: #64748b;
          }
        </style>
      </head>

      <body>
        <p class="marca">MARKET AR</p>

        <h1>
          Reporte financiero de demostración
        </h1>

        <p>
          Generado:
          ${escaparHtml(new Date().toLocaleString('es-PE'))}
        </p>

        <div class="aviso">
          <strong>Documento de demostración.</strong>
          No es factura, declaración tributaria ni
          comprobante fiscal oficial.
          Los importes son de prueba.
        </div>

        <div class="resumen">
          <div class="indicador">
            <small>Disponible para retiro</small>
            <strong>${dinero(this.disponibleRetiro)}</strong>
          </div>

          <div class="indicador">
            <small>En tránsito</small>
            <strong>${dinero(this.enTransito)}</strong>
          </div>

          <div class="indicador">
            <small>Ventas brutas</small>
            <strong>${dinero(this.ventasBrutas)}</strong>
          </div>

          <div class="indicador">
            <small>Comisiones</small>
            <strong>${dinero(this.comisionesPagadas)}</strong>
          </div>
        </div>

        <h2>Movimientos registrados</h2>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Referencia</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>${filas}</tbody>
        </table>

        <footer>
          MarketAR · Información simulada
          para pruebas de interfaz.
        </footer>
      </body>
      </html>
    `;

    // IMPRIMIR SIN LA BARRA LATERAL DE LA WEB
    const marco = document.createElement('iframe');

    marco.style.cssText =
      'position:fixed;width:0;height:0;border:0;left:-10000px;';

    marco.title = 'Reporte financiero para impresión';

    document.body.appendChild(marco);

    const documento = marco.contentDocument;

    if (!documento) {
      marco.remove();
      this.mostrarError(
        'No se pudo preparar el reporte para impresión.'
      );
      return;
    }

    documento.open();
    documento.write(contenido);
    documento.close();

    const ventana = marco.contentWindow;

    if (!ventana) {
      marco.remove();
      this.mostrarError(
        'No se pudo abrir la impresión.'
      );
      return;
    }

    ventana.onafterprint = () => {
      marco.remove();
    };

    setTimeout(() => {
      ventana.focus();
      ventana.print();
    }, 150);

    this.mostrarExito(
      'Reporte listo para guardar como PDF (demostración).'
    );
  }

  // GUARDAR DATOS EN LOCALSTORAGE
  private guardarDatos(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(
        this.claveDatos,
        JSON.stringify({
          cotizaciones: this.cotizaciones,
          movimientos: this.movimientos,
          disponibleRetiro: this.disponibleRetiro,
          retiroSolicitado: this.retiroSolicitado
        })
      );
    } catch {
      this.mostrarError(
        'No se pudieron almacenar los cambios.'
      );
    }
  }

  // RECUPERAR DATOS GUARDADOS
  private recuperarDatos(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const guardado = localStorage.getItem(
        this.claveDatos
      );

      if (!guardado) {
        return;
      }

      const datos = JSON.parse(guardado);

      if (Array.isArray(datos.cotizaciones)) {
        this.cotizaciones = datos.cotizaciones;
      }

      if (Array.isArray(datos.movimientos)) {
        this.movimientos = datos.movimientos;
      }

      if (
        typeof datos.disponibleRetiro === 'number' &&
        Number.isFinite(datos.disponibleRetiro)
      ) {
        this.disponibleRetiro = datos.disponibleRetiro;
      }

      if (
        typeof datos.retiroSolicitado === 'boolean'
      ) {
        this.retiroSolicitado = datos.retiroSolicitado;
      }

    } catch {
      this.mostrarError(
        'No se pudieron recuperar los datos.'
      );
    }
  }

  // MOSTRAR NOTIFICACION DE EXITO
  private mostrarExito(texto: string): void {
    this.tipoMensaje = 'exito';
    this.mensaje = texto;
  }

  // MOSTRAR NOTIFICACION DE ERROR
  private mostrarError(texto: string): void {
    this.tipoMensaje = 'error';
    this.mensaje = texto;
  }
}
