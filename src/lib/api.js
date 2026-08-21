const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'erp:token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api${path}`, {
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

    // Sesión vencida o token inválido: limpiar y mandar a login en vez de
    // dejar al usuario atascado viendo el error crudo en el formulario.
    if (res.status === 401 && path !== '/auth/login') {
      setToken(null);
      localStorage.removeItem('erp:session');
      localStorage.removeItem('erp:permisos');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}
