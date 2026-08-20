import { api } from './api';

export const HORA_ENTRADA_ESPERADA = '08:30';

export function getMarcaciones() {
  return api('/asistencia/marcaciones');
}

export function registrarMarcacion(empleado, fecha, horaEntrada) {
  return api('/asistencia/marcaciones', { method: 'POST', body: { empleado, fecha, horaEntrada } });
}

export function resumenPorEmpleado() {
  return api('/asistencia/resumen');
}
