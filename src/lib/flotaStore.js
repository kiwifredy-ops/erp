import { api } from './api';

export const TIPOS_VEHICULO = ['Camioneta', 'Furgón', 'Automóvil'];
export const ESTADOS_VEHICULO = ['Disponible', 'Asignado', 'En mantención', 'Fuera de servicio'];

const NEXT_ESTADO = {
  Disponible: ['Asignado', 'En mantención', 'Fuera de servicio'],
  Asignado: ['Disponible', 'En mantención'],
  'En mantención': ['Disponible', 'Fuera de servicio'],
  'Fuera de servicio': ['En mantención'],
};

export function getNextEstados(estado) {
  return NEXT_ESTADO[estado] ?? [];
}

export function getVehiculos() {
  return api('/flota/vehiculos');
}

export function getAlertasDocumentos() {
  return api('/flota/vehiculos/alertas');
}

export function crearVehiculo(data) {
  return api('/flota/vehiculos', { method: 'POST', body: data });
}

export function editarDocumentacion(id, cambios) {
  return api(`/flota/vehiculos/${id}`, { method: 'PATCH', body: cambios });
}

export function asignarVehiculo(id, tecnico) {
  return api(`/flota/vehiculos/${id}/asignar`, { method: 'POST', body: { tecnico } });
}

export function cambiarEstadoVehiculo(id, estado, motivo) {
  return api(`/flota/vehiculos/${id}/estado`, { method: 'POST', body: { estado, motivo } });
}

export function registrarMantencion(id, kilometraje, detalle) {
  return api(`/flota/vehiculos/${id}/mantencion`, { method: 'POST', body: { kilometraje, detalle } });
}
