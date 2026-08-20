import { api, setToken, getToken } from './api';

const SESSION_KEY = 'erp:session';

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw || !getToken()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function login(email, password) {
  const { token, usuario } = await api('/auth/login', { method: 'POST', body: { email, password } });
  setToken(token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
  return usuario;
}

export function logout() {
  setToken(null);
  localStorage.removeItem(SESSION_KEY);
}
