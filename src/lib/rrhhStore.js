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

export const AFPS = ['AFP Capital', 'AFP Cuprum', 'AFP Habitat', 'AFP Modelo', 'AFP PlanVital', 'AFP ProVida', 'AFP Uno'];
export const ISAPRES = ['Fonasa', 'Banmédica', 'Consalud', 'Colmena', 'Cruz Blanca', 'Nueva Masvida', 'Vida Tres'];
export const ESTADOS_CIVILES = ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)', 'Conviviente Civil'];
export const GRUPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const CLASES_LICENCIA = ['A1', 'A2', 'A3', 'A4', 'A5', 'B', 'C', 'D', 'F'];

export const TIPOS_DOCUMENTO = [
  'Foto de perfil',
  'Contrato',
  'Anexo de contrato',
  'Cédula - Frente',
  'Cédula - Dorso',
  'Licencia - Frente',
  'Licencia - Dorso',
  'Otro',
];

export function getEmpleados() {
  return api('/rrhh/empleados');
}

export function getAlertas() {
  return api('/rrhh/empleados/alertas');
}

export function crearEmpleado(data) {
  return api('/rrhh/empleados', { method: 'POST', body: data });
}

export function editarEmpleado(id, cambios) {
  return api(`/rrhh/empleados/${id}`, { method: 'PATCH', body: cambios });
}

export function editarPerfilEmpleado(id, cambios) {
  return api(`/rrhh/empleados/${id}/perfil`, { method: 'PATCH', body: cambios });
}

export function cambiarEstadoEmpleado(id, estado, motivo) {
  return api(`/rrhh/empleados/${id}/estado`, { method: 'POST', body: { estado, motivo } });
}

export function getDepartamentosResumen() {
  return api('/rrhh/departamentos-resumen');
}

export function agregarHijo(empleadoId, data) {
  return api(`/rrhh/empleados/${empleadoId}/hijos`, { method: 'POST', body: data });
}

export function eliminarHijo(empleadoId, hijoId) {
  return api(`/rrhh/empleados/${empleadoId}/hijos/${hijoId}`, { method: 'DELETE' });
}

export function subirDocumento(empleadoId, data) {
  return api(`/rrhh/empleados/${empleadoId}/documentos`, { method: 'POST', body: data });
}

export function getDocumento(empleadoId, docId) {
  return api(`/rrhh/empleados/${empleadoId}/documentos/${docId}`);
}

export function eliminarDocumento(empleadoId, docId) {
  return api(`/rrhh/empleados/${empleadoId}/documentos/${docId}`, { method: 'DELETE' });
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
