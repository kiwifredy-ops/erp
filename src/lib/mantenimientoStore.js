import { api } from './api';

export const TIPOS_MANTENIMIENTO = ['Cámaras y CCTV', 'Alarmas', 'Control de Acceso', 'Cercos eléctricos', 'Integral', 'Otro'];
export const PERIODICIDADES = ['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];
export const ESTADOS_VISITA = ['Programada', 'En curso', 'Realizada', 'Cancelada'];

const NEXT_ESTADO_VISITA = {
  Programada: ['En curso', 'Cancelada'],
  'En curso': ['Realizada', 'Cancelada'],
  Realizada: [],
  Cancelada: [],
};

export function getNextEstadosVisita(estado) {
  return NEXT_ESTADO_VISITA[estado] ?? [];
}

// --- Contratos -----------------------------------------------------------

export function getContratos() {
  return api('/mantenimiento/contratos');
}

export function getContrato(id) {
  return api(`/mantenimiento/contratos/${id}`);
}

export function getAlertasContratos() {
  return api('/mantenimiento/contratos/alertas');
}

export function crearContrato(data) {
  return api('/mantenimiento/contratos', { method: 'POST', body: data });
}

export function editarContrato(id, data) {
  return api(`/mantenimiento/contratos/${id}`, { method: 'PATCH', body: data });
}

export function cancelarContrato(id, motivo) {
  return api(`/mantenimiento/contratos/${id}/cancelar`, { method: 'POST', body: { motivo } });
}

// --- Agenda de visitas -----------------------------------------------------

export function getVisitas() {
  return api('/mantenimiento/visitas');
}

// Autoservicio: solo las visitas asignadas al técnico logueado.
export function getMisVisitas() {
  return api('/mantenimiento/visitas/mias');
}

export function crearVisita(data) {
  return api('/mantenimiento/visitas', { method: 'POST', body: data });
}

export function asignarVisita(id, tecnico) {
  return api(`/mantenimiento/visitas/${id}/asignar`, { method: 'POST', body: { tecnico } });
}

export function reprogramarVisita(id, fechaProgramada, motivo) {
  return api(`/mantenimiento/visitas/${id}/reprogramar`, { method: 'POST', body: { fechaProgramada, motivo } });
}

export function cancelarVisita(id, motivo) {
  return api(`/mantenimiento/visitas/${id}/cancelar`, { method: 'POST', body: { motivo } });
}

export function iniciarVisita(id) {
  return api(`/mantenimiento/visitas/${id}/iniciar`, { method: 'POST' });
}

export function completarVisita(id, observaciones) {
  return api(`/mantenimiento/visitas/${id}/completar`, { method: 'POST', body: { observaciones } });
}

// --- Utilidades de vigencia/caducidad --------------------------------------

export function diasHasta(fecha) {
  if (!fecha) return null;
  const ms = new Date(fecha).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function estadoVigencia(contrato) {
  if (contrato.estado === 'Cancelado') return 'Cancelado';
  const dias = diasHasta(contrato.fechaTermino);
  if (dias !== null && dias < 0) return 'Vencido';
  if (dias !== null && dias <= 30) return 'Por vencer';
  return 'Activo';
}
