import { apiPlataforma } from './apiPlataforma';

export function getSolicitudes() {
  return apiPlataforma('/solicitudes');
}

export function actualizarEstadoSolicitud(id, estado) {
  return apiPlataforma(`/solicitudes/${id}`, { method: 'PATCH', body: { estado } });
}
