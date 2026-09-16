// Paralelo a src/lib/api.js, pero para el panel de plataforma (súper
// administrador) — token y sesión completamente separados de erp:*, para
// que una sesión de empresa y una de plataforma puedan convivir en el
// mismo navegador sin pisarse.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'plataforma:token';

export function getPlataformaToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setPlataformaToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiPlataforma(path, { method = 'GET', body } = {}) {
  const token = getPlataformaToken();
  const res = await fetch(`${API_URL}/api/plataforma${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      // respuesta sin cuerpo JSON
    }

    if (res.status === 401 && path !== '/login') {
      setPlataformaToken(null);
      localStorage.removeItem('plataforma:session');
      if (!window.location.pathname.startsWith('/plataforma/login')) {
        window.location.href = '/plataforma/login';
      }
    }

    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}
