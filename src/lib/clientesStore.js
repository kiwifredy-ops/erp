import { api } from './api';

export const TIPOS_CLIENTE = ['Empresa', 'Persona'];

export function getClientes() {
  return api('/clientes');
}

export function getCliente(id) {
  return api(`/clientes/${id}`);
}

export function crearCliente(data) {
  return api('/clientes', { method: 'POST', body: data });
}

export function editarCliente(id, data) {
  return api(`/clientes/${id}`, { method: 'PATCH', body: data });
}

export function toggleClienteActivo(id) {
  return api(`/clientes/${id}/toggle`, { method: 'POST' });
}
