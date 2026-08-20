import { api } from './api';

export const DEPARTAMENTOS = [
  'Operaciones / Técnica',
  'Ventas',
  'Administración y Finanzas',
  'Bodega y Logística',
  'Gerencia',
];

export const TIPOS_CONTRATO = ['Indefinido', 'Plazo fijo', 'Honorarios', 'Por obra o faena'];

export const ESTADOS_EMPLEADO = ['Activo', 'Vacaciones', 'Licencia médica', 'Baja'];

const NEXT_ESTADO = {
  Activo: ['Vacaciones', 'Licencia médica', 'Baja'],
  Vacaciones: ['Activo', 'Baja'],
  'Licencia médica': ['Activo', 'Baja'],
  Baja: [],
};

export function getNextEstados(estado) {
  return NEXT_ESTADO[estado] ?? [];
}

export function getEmpleados() {
  return api('/rrhh/empleados');
}

export function crearEmpleado(data) {
  return api('/rrhh/empleados', { method: 'POST', body: data });
}

export function editarEmpleado(id, cambios) {
  return api(`/rrhh/empleados/${id}`, { method: 'PATCH', body: cambios });
}

export function cambiarEstadoEmpleado(id, estado, motivo) {
  return api(`/rrhh/empleados/${id}/estado`, { method: 'POST', body: { estado, motivo } });
}

export function getDepartamentosResumen() {
  return api('/rrhh/departamentos-resumen');
}
