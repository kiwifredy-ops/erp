import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth.js';
import { requirePermiso } from '../middleware/permisos.js';
import { resolveTenant } from '../middleware/tenant.js';
import { prismaPlataforma } from '../prismaPlataforma.js';
import { TODOS_LOS_MODULOS } from '../lib/permisosDefault.js';

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth, resolveTenant);

usuariosRouter.get('/', requirePermiso('usuarios', 'ver'), async (req, res) => {
  const usuarios = await req.prisma.usuario.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(usuarios);
});

usuariosRouter.post('/', requirePermiso('usuarios', 'crear'), async (req, res) => {
  const { nombre, email, rol, password } = req.body;
  if (!nombre || !email || !rol || !password) return res.status(400).json({ error: 'Faltan datos del usuario' });

  const emailNormalizado = email.toLowerCase();
  // El correo debe ser único en TODA la plataforma, no solo dentro de esta
  // empresa: el login lo usa para resolver a qué empresa pertenece un
  // usuario. No se revela si el correo ya está tomado por otra empresa —
  // el mensaje es el mismo que si fuera de esta misma empresa.
  const yaIndexado = await prismaPlataforma.usuarioIndex.findUnique({ where: { email: emailNormalizado } });
  if (yaIndexado) return res.status(400).json({ error: 'Ya existe un usuario con ese correo' });

  const hash = await bcrypt.hash(password, 10);
  const usuario = await req.prisma.usuario.create({
    data: { nombre, email: emailNormalizado, rol, password: hash },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });

  try {
    await prismaPlataforma.usuarioIndex.create({ data: { email: emailNormalizado, empresaId: req.user.empresaId } });
  } catch (err) {
    // El usuario ya se creó en la empresa pero no se pudo indexar
    // globalmente — no podría iniciar sesión. Se revierte para no dejar un
    // usuario huérfano, y se informa para reintentar.
    await req.prisma.usuario.delete({ where: { id: usuario.id } });
    throw err;
  }

  res.status(201).json(usuario);
});

usuariosRouter.patch('/:id', requirePermiso('usuarios', 'editar'), async (req, res) => {
  const { nombre, rol } = req.body;
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (rol !== undefined) data.rol = rol;
  const usuario = await req.prisma.usuario.update({
    where: { id: req.params.id },
    data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
  res.json(usuario);
});

usuariosRouter.post('/:id/toggle', requirePermiso('usuarios', 'editar'), async (req, res) => {
  const before = await req.prisma.usuario.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Usuario no encontrado' });
  const usuario = await req.prisma.usuario.update({
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
  await req.prisma.usuario.update({ where: { id: req.params.id }, data: { password: hash } });
  res.json({ ok: true });
});

// --- Roles y Permisos --------------------------------------------------------

usuariosRouter.get('/roles', requirePermiso('usuarios', 'ver'), async (req, res) => {
  const [permisos, usuarios] = await Promise.all([
    req.prisma.rolPermiso.findMany(),
    req.prisma.usuario.findMany({ select: { rol: true }, distinct: ['rol'] }),
  ]);
  const roles = new Set([...permisos.map((p) => p.rol), ...usuarios.map((u) => u.rol)]);
  res.json({ roles: [...roles].sort(), modulos: TODOS_LOS_MODULOS, permisos });
});

usuariosRouter.post('/roles/:rol/permisos', requirePermiso('usuarios', 'editar'), async (req, res) => {
  const rol = decodeURIComponent(req.params.rol);
  const { moduloId, puedeVer, puedeCrear, puedeEditar, puedeEliminar } = req.body;
  if (!TODOS_LOS_MODULOS.includes(moduloId)) return res.status(400).json({ error: 'Módulo inválido' });

  const permiso = await req.prisma.rolPermiso.upsert({
    where: { rol_moduloId: { rol, moduloId } },
    update: { puedeVer: !!puedeVer, puedeCrear: !!puedeCrear, puedeEditar: !!puedeEditar, puedeEliminar: !!puedeEliminar },
    create: { rol, moduloId, puedeVer: !!puedeVer, puedeCrear: !!puedeCrear, puedeEditar: !!puedeEditar, puedeEliminar: !!puedeEliminar },
  });
  res.json(permiso);
});
