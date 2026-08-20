import { load, save, seedOnce } from './storage';

const SESSION_KEY = 'session';
const USERS_KEY = 'usuarios';

export const ROLES = [
  'Administrador del Sistema',
  'Gerencia General',
  'RRHH',
  'Jefe de Almacén',
  'Supervisor de Operaciones',
  'Técnico de Campo',
  'Finanzas',
];

function seedUsers() {
  return [
    { id: 'u1', nombre: 'Administrador General', email: 'admin@empresa.com', rol: 'Administrador del Sistema', activo: true },
    { id: 'u2', nombre: 'Carolina Reyes', email: 'carolina.reyes@empresa.com', rol: 'RRHH', activo: true },
    { id: 'u3', nombre: 'Marcelo Soto', email: 'marcelo.soto@empresa.com', rol: 'Jefe de Almacén', activo: true },
    { id: 'u4', nombre: 'Fernanda Vidal', email: 'fernanda.vidal@empresa.com', rol: 'Finanzas', activo: true },
    { id: 'u5', nombre: 'Diego Herrera', email: 'diego.herrera@empresa.com', rol: 'Supervisor de Operaciones', activo: true },
    { id: 'u6', nombre: 'Pablo Contreras', email: 'pablo.contreras@empresa.com', rol: 'Técnico de Campo', activo: true },
    { id: 'u7', nombre: 'Ignacio Rojas', email: 'gerencia@empresa.com', rol: 'Gerencia General', activo: true },
  ];
}

export function getUsers() {
  return seedOnce(USERS_KEY, seedUsers);
}

export function getSession() {
  return load(SESSION_KEY, null);
}

export function login(email) {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.activo);
  if (!user) return null;
  save(SESSION_KEY, user);
  return user;
}

export function logout() {
  localStorage.removeItem('erp:' + SESSION_KEY);
}
