import { api } from './api';

export const ROLES_BASE = [
  'Administrador del Sistema',
  'Gerencia General',
  'RRHH',
  'Jefe de Almacén',
  'Supervisor de Operaciones',
  'Técnico de Campo',
  'Finanzas',
];

export function getUsuarios() {
  return api('/usuarios');
}

export function crearUsuario(data) {
  return api('/usuarios', { method: 'POST', body: data });
}

export function editarUsuario(id, data) {
  return api(`/usuarios/${id}`, { method: 'PATCH', body: data });
}

export function toggleUsuarioActivo(id) {
  return api(`/usuarios/${id}/toggle`, { method: 'POST' });
}

export function cambiarPassword(id, password) {
  return api(`/usuarios/${id}/password`, { method: 'POST', body: { password } });
}

export function getRolesPermisos() {
  return api('/usuarios/roles');
}

export function guardarPermiso(rol, data) {
  return api(`/usuarios/roles/${encodeURIComponent(rol)}/permisos`, { method: 'POST', body: data });
}
