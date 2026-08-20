import { api } from './api';

export const CATEGORIAS_ITEM = ['Cámaras', 'Sensores', 'Cableado', 'Control de Acceso', 'Alarmas', 'Herramientas', 'Consumibles'];
export const UNIDADES = ['unidad', 'metro', 'caja', 'rollo'];

export function getItems() {
  return api('/almacen/items');
}

export function crearItem(data) {
  return api('/almacen/items', { method: 'POST', body: data });
}

export function registrarMovimiento(itemId, tipo, cantidad, motivo) {
  return api(`/almacen/items/${itemId}/movimientos`, { method: 'POST', body: { tipo, cantidad, motivo } });
}

export function getEquipos() {
  return api('/almacen/equipos');
}

export function asignarEquipo(id, tecnico) {
  return api(`/almacen/equipos/${id}/asignar`, { method: 'POST', body: { tecnico } });
}

export function devolverEquipo(id) {
  return api(`/almacen/equipos/${id}/devolver`, { method: 'POST' });
}
