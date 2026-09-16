// Matriz de permisos por defecto — fuente única usada tanto al sembrar una
// base nueva (server/prisma/seed.js) como al aprovisionar una empresa nueva
// desde el panel de plataforma (server/src/services/tenantProvisioning.js),
// para no mantener dos copias que puedan desincronizarse.

export const TODO = { puedeVer: true, puedeCrear: true, puedeEditar: true, puedeEliminar: true };
export const SOLO_VER = { puedeVer: true, puedeCrear: false, puedeEditar: false, puedeEliminar: false };
export const VER_EDITAR = { puedeVer: true, puedeCrear: false, puedeEditar: true, puedeEliminar: false };
// Ver+crear+editar sin eliminar — vista completa de Asistencia (todos los
// empleados), reservada a quien administra/audita la asistencia del personal.
export const AUTOSERVICIO = { puedeVer: true, puedeCrear: true, puedeEditar: true, puedeEliminar: false };
// Sin "ver": solo autoservicio real — cada quien marca y consulta
// únicamente su propia entrada/salida, sin visibilidad del resto del
// personal. Es el default para todos los roles salvo Administrador y RRHH.
export const AUTOSERVICIO_PROPIO = { puedeVer: false, puedeCrear: true, puedeEditar: true, puedeEliminar: false };
// Autoservicio de Rendición de Gastos: puede enviar sus propias rendiciones
// pero no ve las de otros ni puede aprobarlas/pagarlas (eso requiere "ver").
export const AUTOSERVICIO_GASTOS = { puedeVer: false, puedeCrear: true, puedeEditar: false, puedeEliminar: false };
// Autoservicio de Tickets/Flota/Mantenimiento: puede ejecutar el trabajo ya
// asignado a su nombre (iniciar/finalizar servicio, registrar mantención de
// su vehículo o visita) pero no ve el resto ni puede asignar, reasignar,
// reprogramar o cerrar/cancelar.
export const AUTOSERVICIO_ASIGNADO = { puedeVer: false, puedeCrear: false, puedeEditar: true, puedeEliminar: false };

export const TODOS_LOS_MODULOS = ['rrhh', 'almacen', 'gastos', 'asistencia', 'flota', 'abastecimiento', 'contabilidad', 'tickets', 'clientes', 'usuarios', 'mantenimiento', 'prevencion'];

// El administrador de cada empresa puede reconfigurar todo esto libremente
// después desde el módulo de Usuarios. Todos los roles pueden marcar su
// propia entrada/salida en Asistencia, pero solo Administrador y RRHH ven la
// asistencia de todo el personal por defecto.
export const PERMISOS_POR_ROL = {
  'Administrador del Sistema': Object.fromEntries(TODOS_LOS_MODULOS.map((m) => [m, TODO])),
  'Gerencia General': { ...Object.fromEntries(TODOS_LOS_MODULOS.map((m) => [m, SOLO_VER])), asistencia: AUTOSERVICIO_PROPIO },
  RRHH: { rrhh: TODO, asistencia: AUTOSERVICIO, prevencion: TODO },
  'Jefe de Almacén': { almacen: TODO, abastecimiento: TODO, asistencia: AUTOSERVICIO_PROPIO },
  'Supervisor de Operaciones': { tickets: TODO, flota: TODO, mantenimiento: TODO, clientes: VER_EDITAR, rrhh: SOLO_VER, prevencion: SOLO_VER, asistencia: AUTOSERVICIO_PROPIO },
  'Técnico de Campo': { tickets: AUTOSERVICIO_ASIGNADO, gastos: AUTOSERVICIO_GASTOS, flota: AUTOSERVICIO_ASIGNADO, mantenimiento: AUTOSERVICIO_ASIGNADO, asistencia: AUTOSERVICIO_PROPIO },
  Finanzas: { contabilidad: TODO, gastos: SOLO_VER, abastecimiento: SOLO_VER, clientes: SOLO_VER, asistencia: AUTOSERVICIO_PROPIO },
};
