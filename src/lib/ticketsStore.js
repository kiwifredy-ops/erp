import { api } from './api';

export const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente'];
export const ESTADOS_TICKET = ['Abierto', 'Asignado', 'En curso', 'Completado', 'Cerrado', 'Cancelado'];

const NEXT_ESTADO = {
  Abierto: ['Cancelado'],
  Asignado: ['Cancelado'],
  'En curso': ['Cancelado'],
  Completado: ['Cerrado'],
  Cerrado: [],
  Cancelado: [],
};

export function getNextEstados(estado) {
  return NEXT_ESTADO[estado] ?? [];
}

export function getTickets() {
  return api('/tickets');
}

export function crearTicket(data) {
  return api('/tickets', { method: 'POST', body: data });
}

export function asignarTicket(id, tecnico) {
  return api(`/tickets/${id}/asignar`, { method: 'POST', body: { tecnico } });
}

export function iniciarServicio(id, coords) {
  return api(`/tickets/${id}/iniciar`, { method: 'POST', body: coords });
}

export function finalizarServicio(id, data) {
  return api(`/tickets/${id}/finalizar`, { method: 'POST', body: data });
}

export function firmarTicket(id, firma) {
  return api(`/tickets/${id}/firma`, { method: 'POST', body: { firma } });
}

export function responderEncuesta(id, data) {
  return api(`/tickets/${id}/encuesta`, { method: 'POST', body: data });
}

export function cerrarTicket(id) {
  return api(`/tickets/${id}/cerrar`, { method: 'POST' });
}

export function cancelarTicket(id, motivo) {
  return api(`/tickets/${id}/cancelar`, { method: 'POST', body: { motivo } });
}

export function subirArchivo(id, data) {
  return api(`/tickets/${id}/archivos`, { method: 'POST', body: data });
}

export function getArchivo(id, archivoId) {
  return api(`/tickets/${id}/archivos/${archivoId}`);
}

export function eliminarArchivo(id, archivoId) {
  return api(`/tickets/${id}/archivos/${archivoId}`, { method: 'DELETE' });
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getUbicacionActual() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: null, lng: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}
