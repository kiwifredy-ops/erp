import { apiPlataforma, setPlataformaToken, getPlataformaToken } from './apiPlataforma';

const SESSION_KEY = 'plataforma:session';

export function getPlataformaSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw || !getPlataformaToken()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loginPlataforma(email, password) {
  const { token, superUsuario } = await apiPlataforma('/login', { method: 'POST', body: { email, password } });
  setPlataformaToken(token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(superUsuario));
  return superUsuario;
}

export function logoutPlataforma() {
  setPlataformaToken(null);
  localStorage.removeItem(SESSION_KEY);
}
