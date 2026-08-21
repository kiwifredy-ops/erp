import { api } from './api';

export const HORA_ENTRADA_ESPERADA = '08:30';

export function getMarcaciones() {
  return api('/asistencia/marcaciones');
}

export function marcarEntrada(empleado, fecha, hora, coords) {
  return api('/asistencia/marcaciones/entrada', { method: 'POST', body: { empleado, fecha, hora, lat: coords?.lat, lng: coords?.lng } });
}

export function marcarSalida(id, hora, coords) {
  return api(`/asistencia/marcaciones/${id}/salida`, { method: 'POST', body: { hora, lat: coords?.lat, lng: coords?.lng } });
}

export function resumenPorEmpleado() {
  return api('/asistencia/resumen');
}

// Devuelve coordenadas del navegador si el usuario las autoriza; si no,
// la marcación sigue funcionando sin geolocalización (no bloqueante).
export function obtenerUbicacion() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

export function mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
