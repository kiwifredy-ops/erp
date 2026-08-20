import { api } from './api';

export const ESTADOS_ORDEN = ['Solicitada', 'Aprobada', 'En tránsito', 'Recibida', 'Rechazada'];
export const RUBROS_PROVEEDOR = ['Cámaras y Sensores', 'Cableado y Conectores', 'Control de Acceso', 'Alarmas', 'Ferretería', 'Servicios Generales'];

const NEXT_ESTADO = {
  Solicitada: ['Aprobada', 'Rechazada'],
  Aprobada: ['En tránsito'],
  'En tránsito': ['Recibida'],
  Recibida: [],
  Rechazada: [],
};

export function getNextEstados(estado) {
  return NEXT_ESTADO[estado] ?? [];
}

export function getTotalOrden(orden) {
  return orden.items.reduce((sum, it) => sum + Number(it.cantidad || 0) * Number(it.precioUnitario || 0), 0);
}

export function getProveedores() {
  return api('/abastecimiento/proveedores');
}

export function crearProveedor(data) {
  return api('/abastecimiento/proveedores', { method: 'POST', body: data });
}

export function toggleProveedorActivo(id) {
  return api(`/abastecimiento/proveedores/${id}/toggle`, { method: 'POST' });
}

export function getOrdenes() {
  return api('/abastecimiento/ordenes');
}

export function crearOrden(data) {
  return api('/abastecimiento/ordenes', { method: 'POST', body: data });
}

export function cambiarEstadoOrden(id, estado, motivo) {
  return api(`/abastecimiento/ordenes/${id}/estado`, { method: 'POST', body: { estado, motivo } });
}
