import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermiso } from '../middleware/permisos.js';

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth);

const MODULO_IDS = ['rrhh', 'almacen', 'gastos', 'asistencia', 'flota', 'abastecimiento', 'contabilidad', 'tickets', 'clientes', 'usuarios'];

usuariosRouter.get('/', requirePermiso('usuarios', 'ver'), async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(usuarios);
});

usuariosRouter.post('/', requirePermiso('usuarios', 'crear'), async (req, res) => {
  const { nombre, email, rol, password } = req.body;
  if (!nombre || !email || !rol || !password) return res.status(400).json({ error: 'Faltan datos del usuario' });

  const existente = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
  if (existente) return res.status(400).json({ error: 'Ya existe un usuario con ese correo' });

  const hash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({
    data: { nombre, email: email.toLowerCase(), rol, password: hash },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
  res.status(201).json(usuario);
});

usuariosRouter.patch('/:id', requirePermiso('usuarios', 'editar'), async (req, res) => {
  const { nombre, rol } = req.body;
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (rol !== undefined) data.rol = rol;
  const usuario = await prisma.usuario.update({
    where: { id: req.params.id },
    data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
  res.json(usuario);
});

usuariosRouter.post('/:id/toggle', requirePermiso('usuarios', 'editar'), async (req, res) => {
  const before = await prisma.usuario.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Usuario no encontrado' });
  const usuario = await prisma.usuario.update({
    where: { id: req.params.id },
    data: { activo: !before.activo },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
  res.json(usuario);
});

usuariosRouter.post('/:id/password', requirePermiso('usuarios', 'editar'), async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  const hash = await bcrypt.hash(password, 10);
  await prisma.usuario.update({ where: { id: req.params.id }, data: { password: hash } });
  res.json({ ok: true });
});

// --- Roles y Permisos --------------------------------------------------------

usuariosRouter.get('/roles', requirePermiso('usuarios', 'ver'), async (req, res) => {
  const [permisos, usuarios] = await Promise.all([
    prisma.rolPermiso.findMany(),
    prisma.usuario.findMany({ select: { rol: true }, distinct: ['rol'] }),
  ]);
  const roles = new Set([...permisos.map((p) => p.rol), ...usuarios.map((u) => u.rol)]);
  res.json({ roles: [...roles].sort(), modulos: MODULO_IDS, permisos });
});

usuariosRouter.post('/roles/:rol/permisos', requirePermiso('usuarios', 'editar'), async (req, res) => {
  const rol = decodeURIComponent(req.params.rol);
  const { moduloId, puedeVer, puedeCrear, puedeEditar, puedeEliminar } = req.body;
  if (!MODULO_IDS.includes(moduloId)) return res.status(400).json({ error: 'Módulo inválido' });

  const permiso = await prisma.rolPermiso.upsert({
    where: { rol_moduloId: { rol, moduloId } },
    update: { puedeVer: !!puedeVer, puedeCrear: !!puedeCrear, puedeEditar: !!puedeEditar, puedeEliminar: !!puedeEliminar },
    create: { rol, moduloId, puedeVer: !!puedeVer, puedeCrear: !!puedeCrear, puedeEditar: !!puedeEditar, puedeEliminar: !!puedeEliminar },
  });
  res.json(permiso);
});
