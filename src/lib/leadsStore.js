import { api } from './api';

export function enviarSolicitud(data) {
  return api('/plataforma/solicitudes', { method: 'POST', body: data });
}
