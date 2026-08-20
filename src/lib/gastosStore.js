import { api } from './api';

export const CATEGORIAS_GASTO = ['Combustible', 'Peajes', 'Alojamiento', 'Alimentación', 'Estacionamiento', 'Otros'];

export const ESTADOS_RENDICION = ['Enviada', 'En revisión', 'Aprobada', 'Rechazada', 'Pagada'];

const NEXT_ESTADO = {
  Enviada: ['En revisión', 'Rechazada'],
  'En revisión': ['Aprobada', 'Rechazada'],
  Aprobada: ['Pagada'],
  Rechazada: [],
  Pagada: [],
};

export function getNextEstados(estado) {
  return NEXT_ESTADO[estado] ?? [];
}

export function getTotal(rendicion) {
  return rendicion.lineas.reduce((sum, l) => sum + Number(l.monto || 0), 0);
}

export function getRendiciones() {
  return api('/gastos/rendiciones');
}

export function crearRendicion(data) {
  return api('/gastos/rendiciones', { method: 'POST', body: data });
}

export function cambiarEstadoRendicion(id, estado, motivo) {
  return api(`/gastos/rendiciones/${id}/estado`, { method: 'POST', body: { estado, motivo } });
}
