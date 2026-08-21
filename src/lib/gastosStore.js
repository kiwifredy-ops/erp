import { api } from './api';

export const CATEGORIAS_GASTO = ['Combustible', 'Peajes', 'Alojamiento', 'Alimentación', 'Estacionamiento', 'Kilometraje', 'Otros'];

export const ESTADOS_RENDICION = ['Enviada', 'En revisión', 'Aprobada', 'Rechazada', 'Pagada'];

// Tarifa de reembolso por kilómetro recorrido con vehículo propio (CLP).
export const TARIFA_KM = 130;

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

export function getComprobante(rendicionId, lineaId) {
  return api(`/gastos/rendiciones/${rendicionId}/lineas/${lineaId}/comprobante`);
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
