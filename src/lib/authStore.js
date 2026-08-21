import { api, setToken, getToken } from './api';

const SESSION_KEY = 'erp:session';
const PERMISOS_KEY = 'erp:permisos';

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw || !getToken()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getPermisos() {
  const raw = localStorage.getItem(PERMISOS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function permisoDe(moduloId) {
  return getPermisos().find((p) => p.moduloId === moduloId);
}

export function puedeVer(moduloId) {
  return !!permisoDe(moduloId)?.puedeVer;
}
export function puedeCrear(moduloId) {
  return !!permisoDe(moduloId)?.puedeCrear;
}
export function puedeEditar(moduloId) {
  return !!permisoDe(moduloId)?.puedeEditar;
}
export function puedeEliminar(moduloId) {
  return !!permisoDe(moduloId)?.puedeEliminar;
}

export async function login(email, password) {
  const { token, usuario, permisos } = await api('/auth/login', { method: 'POST', body: { email, password } });
  setToken(token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
  localStorage.setItem(PERMISOS_KEY, JSON.stringify(permisos));
  return usuario;
}

export async function refreshPermisos() {
  const { permisos } = await api('/auth/me');
  localStorage.setItem(PERMISOS_KEY, JSON.stringify(permisos));
  return permisos;
}

export function logout() {
  setToken(null);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PERMISOS_KEY);
}
