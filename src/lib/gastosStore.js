import { api } from './api';

export const CATEGORIAS_GASTO = ['Combustible', 'Peajes', 'Alojamiento', 'Alimentación', 'Estacionamiento', 'Kilometraje', 'Otros'];

export const ESTADOS_RENDICION = ['Enviada', 'En revisión', 'Aprobada', 'Rechazada', 'Pagada'];

// Tarifa de reembolso por kilómetro recorrido con vehículo propio (CLP).
export const TARIFA_KM = 130;

export const TIPOS_DOCUMENTO = [
  'Boleta electrónica',
  'Factura electrónica',
  'Factura exenta',
  'Boleta exenta',
  'Factura de compra',
  'Boleta de honorarios',
  'Guía de despacho',
  'Sin documento',
];

const TIPOS_IVA_AFECTO = ['Factura electrónica', 'Factura de compra'];
const TIPOS_EXENTO = ['Factura exenta', 'Boleta exenta'];

// Solo de previsualización en el formulario — el backend recalcula y es la
// fuente de verdad al guardar.
export function calcularIva(monto, tipoDocumento) {
  const bruto = Number(monto) || 0;
  if (TIPOS_IVA_AFECTO.includes(tipoDocumento)) {
    const montoNeto = Math.round(bruto / 1.19);
    return { montoNeto, iva: bruto - montoNeto, ivaRecuperable: true };
  }
  if (TIPOS_EXENTO.includes(tipoDocumento)) {
    return { montoNeto: bruto, iva: 0, ivaRecuperable: false };
  }
  return { montoNeto: null, iva: null, ivaRecuperable: false };
}

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

// Autoservicio: solo las rendiciones enviadas por el usuario logueado.
export function getMisRendiciones() {
  return api('/gastos/rendiciones/mias');
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
