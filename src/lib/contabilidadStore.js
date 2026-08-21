import { api } from './api';

export const TIPOS_CUENTA = ['Cuenta Corriente', 'Cuenta Vista', 'Cuenta de Ahorro'];
export const MEDIOS_PAGO = ['Transferencia', 'Efectivo', 'Cheque', 'Tarjeta de crédito', 'Tarjeta de débito'];
export const CATEGORIAS_MOVIMIENTO = ['Gasto operacional', 'Transferencia', 'Ajuste', 'Otro ingreso', 'Otro egreso'];
export const ESTADOS_FACTURA = ['Pendiente', 'Pagada', 'Anulada'];

export const formatCLP = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

// --- Cuentas bancarias -------------------------------------------------------

export function getCuentas() {
  return api('/contabilidad/cuentas');
}

export function crearCuenta(data) {
  return api('/contabilidad/cuentas', { method: 'POST', body: data });
}

export function registrarMovimiento(cuentaId, data) {
  return api(`/contabilidad/cuentas/${cuentaId}/movimiento`, { method: 'POST', body: data });
}

// --- Facturas de venta ---------------------------------------------------------

export function getFacturasVenta() {
  return api('/contabilidad/facturas-venta');
}

export function crearFacturaVenta(data) {
  return api('/contabilidad/facturas-venta', { method: 'POST', body: data });
}

export function registrarPagoCliente(facturaId, data) {
  return api(`/contabilidad/facturas-venta/${facturaId}/pago`, { method: 'POST', body: data });
}

export function crearNotaCreditoVenta(facturaId, data) {
  return api(`/contabilidad/facturas-venta/${facturaId}/notas-credito`, { method: 'POST', body: data });
}

export function anularFacturaVenta(facturaId, motivo) {
  return api(`/contabilidad/facturas-venta/${facturaId}/anular`, { method: 'POST', body: { motivo } });
}

// --- Facturas de compra ------------------------------------------------------

export function getFacturasCompra() {
  return api('/contabilidad/facturas-compra');
}

export function crearFacturaCompra(data) {
  return api('/contabilidad/facturas-compra', { method: 'POST', body: data });
}

export function registrarPagoProveedor(facturaId, data) {
  return api(`/contabilidad/facturas-compra/${facturaId}/pago`, { method: 'POST', body: data });
}

export function crearNotaCreditoCompra(facturaId, data) {
  return api(`/contabilidad/facturas-compra/${facturaId}/notas-credito`, { method: 'POST', body: data });
}

export function anularFacturaCompra(facturaId, motivo) {
  return api(`/contabilidad/facturas-compra/${facturaId}/anular`, { method: 'POST', body: { motivo } });
}

// --- Resumen y alertas ---------------------------------------------------------

export function getResumen() {
  return api('/contabilidad/resumen');
}

export function getAlertasContabilidad() {
  return api('/contabilidad/alertas');
}
