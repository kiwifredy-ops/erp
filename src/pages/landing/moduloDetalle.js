// Descripciones funcionales detalladas para el popup de cada módulo en la
// landing — más extensas que el resumen de una línea usado en el resto de
// la app (src/lib/modules.js).
export const MODULO_DETALLE = {
  rrhh: {
    resumen: 'Ficha completa de cada trabajador, desde su contratación hasta su salida.',
    funciones: [
      'Ficha de perfil por empleado: datos personales, cargo, departamento y tipo de contrato.',
      'Registro de cargas familiares y documentos asociados a cada trabajador.',
      'Gestión documental: contratos, anexos y certificados guardados por empleado.',
      'Alertas automáticas de vencimientos (contratos a plazo fijo, licencias, etc.).',
      'Organización por departamentos, con historial de cambios de cada persona.',
    ],
  },
  almacen: {
    resumen: 'Control de inventario y equipos, con alertas antes de que el stock se agote.',
    funciones: [
      'Inventario de materiales con entradas, salidas y saldo actual por ítem.',
      'Registro de equipos: número de serie, estado y ubicación.',
      'Alertas automáticas de stock bajo mínimo antes de que falte material.',
      'Historial de movimientos de bodega, trazable por fecha y responsable.',
    ],
  },
  gastos: {
    resumen: 'Rendición de gastos de terreno, con aprobación y reembolso ordenados.',
    funciones: [
      'Los técnicos registran sus gastos de terreno (viáticos, combustible, materiales) desde su propia vista.',
      'Adjuntan la boleta o comprobante directamente a cada gasto.',
      'Flujo de aprobación: el supervisor revisa y aprueba o rechaza cada rendición.',
      'Seguimiento del estado de reembolso hasta el pago final.',
    ],
  },
  asistencia: {
    resumen: 'Marcaciones de entrada y salida, con resumen de horas por persona y equipo.',
    funciones: [
      'Marcación de entrada y salida por cada trabajador, con fecha y hora.',
      'Vista de autoservicio: cada empleado revisa su propia asistencia.',
      'Resumen agregado de horas trabajadas, atrasos e inasistencias.',
      'Base para el cálculo de turnos y control de cumplimiento de jornada.',
    ],
  },
  flota: {
    resumen: 'Vehículos, sus mantenciones y documentación, sin sorpresas de vencimiento.',
    funciones: [
      'Ficha de cada vehículo: patente, asignación y estado actual.',
      'Registro de mantenciones realizadas y programadas.',
      'Alertas automáticas de documentos por vencer (permiso de circulación, seguro, revisión técnica).',
      'Vista "Mi vehículo" para que el conductor consulte el suyo sin ver el resto de la flota.',
    ],
  },
  abastecimiento: {
    resumen: 'Órdenes de compra y proveedores, con alertas de seguimiento.',
    funciones: [
      'Creación y seguimiento de órdenes de compra, de solicitud a recepción.',
      'Base de proveedores con su información de contacto y rubro.',
      'Alertas de órdenes pendientes o con retraso en su entrega.',
      'Conexión directa con el inventario de Almacén al recibir materiales.',
    ],
  },
  contabilidad: {
    resumen: 'Facturas de venta y compra, cuentas bancarias y un resumen financiero al día.',
    funciones: [
      'Registro de facturas de venta y de compra, con sus notas de crédito asociadas.',
      'Gestión de cuentas bancarias de la empresa.',
      'Resumen financiero con la información consolidada de ingresos y pagos.',
      'Seguimiento del estado de pago de cada documento.',
    ],
  },
  tickets: {
    resumen: 'Mesa de ayuda con técnicos en terreno, evidencia fotográfica y firma del cliente.',
    funciones: [
      'Creación de tickets de servicio y asignación a un técnico.',
      'El técnico en terreno reporta con ubicación GPS, fotos y video de respaldo.',
      'Firma digital del cliente al cierre de la visita.',
      'Encuesta de satisfacción enviada al cliente al finalizar el ticket.',
      'Vista "Mis tickets" para que cada técnico gestione su propia carga de trabajo.',
    ],
  },
  clientes: {
    resumen: 'Base de clientes conectada con tickets de servicio y facturación.',
    funciones: [
      'Ficha de cliente con sus datos de contacto y ubicación.',
      'Historial de tickets de servicio asociados a cada cliente.',
      'Vínculo directo con las facturas de venta emitidas a ese cliente.',
    ],
  },
  mantenimiento: {
    resumen: 'Contratos de mantención con agenda propia y alertas de vencimiento.',
    funciones: [
      'Contratos de mantención por cliente, con su periodicidad y servicios incluidos.',
      'Agenda de visitas programadas, recurrentes o puntuales.',
      'Alertas automáticas de contratos próximos a caducar.',
      'Vista "Mis visitas" para que el técnico vea su propia agenda asignada.',
    ],
  },
  usuarios: {
    resumen: 'Cuentas de acceso y permisos, definidos módulo por módulo.',
    funciones: [
      'Creación de cuentas de usuario y asignación de rol.',
      'Permisos independientes de ver, crear, editar y eliminar por cada módulo.',
      'Activación o desactivación de accesos sin perder el historial del usuario.',
    ],
  },
};
