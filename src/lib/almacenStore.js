import { api } from './api';

export const CATEGORIAS_ITEM = ['Cámaras', 'Sensores', 'Cableado', 'Control de Acceso', 'Alarmas', 'Herramientas', 'Consumibles'];
export const UNIDADES = ['unidad', 'metro', 'caja', 'rollo'];
export const TIPOS_EQUIPO = ['Cámaras', 'DVR/NVR', 'Paneles de alarma', 'Control de acceso', 'Herramientas', 'Electrónica', 'Otro'];

export function getItems() {
  return api('/almacen/items');
}

export function getAlertasStock() {
  return api('/almacen/items/alertas');
}

export function crearItem(data) {
  return api('/almacen/items', { method: 'POST', body: data });
}

export function registrarMovimiento(itemId, tipo, cantidad, motivo) {
  return api(`/almacen/items/${itemId}/movimientos`, { method: 'POST', body: { tipo, cantidad, motivo } });
}

export function solicitarReposicion(itemId, data) {
  return api(`/almacen/items/${itemId}/solicitar-reposicion`, { method: 'POST', body: data });
}

export function getEquipos() {
  return api('/almacen/equipos');
}

export function crearEquipo(data) {
  return api('/almacen/equipos', { method: 'POST', body: data });
}

export function editarEquipo(id, cambios) {
  return api(`/almacen/equipos/${id}`, { method: 'PATCH', body: cambios });
}

export function asignarEquipo(id, tecnico, clienteInstalacion) {
  return api(`/almacen/equipos/${id}/asignar`, { method: 'POST', body: { tecnico, clienteInstalacion } });
}

export function devolverEquipo(id) {
  return api(`/almacen/equipos/${id}/devolver`, { method: 'POST' });
}

export function estadoGarantia(equipo) {
  if (!equipo.fechaCompra || !equipo.mesesGarantia) return null;
  const vencimiento = new Date(equipo.fechaCompra);
  vencimiento.setMonth(vencimiento.getMonth() + equipo.mesesGarantia);
  return vencimiento >= new Date() ? { estado: 'Vigente', vencimiento } : { estado: 'Vencida', vencimiento };
}
