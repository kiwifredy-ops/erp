import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prismaPlataforma } from '../prismaPlataforma.js';
import { getTenantPrisma } from '../tenantPrismaCache.js';
import { requireSuperAdmin } from '../middleware/superAuth.js';
import { invalidateEmpresaCache } from '../middleware/tenant.js';
import { provisionEmpresa } from '../services/tenantProvisioning.js';
import { TODOS_LOS_MODULOS } from '../lib/permisosDefault.js';

export const plataformaRouter = Router();

plataformaRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña son requeridos' });

  const superUsuario = await prismaPlataforma.superUsuario.findUnique({ where: { email: email.toLowerCase() } });
  if (!superUsuario || !superUsuario.activo) return res.status(401).json({ error: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, superUsuario.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: superUsuario.id, email: superUsuario.email, nombre: superUsuario.nombre, tipo: 'plataforma' },
    process.env.JWT_SECRET_PLATAFORMA,
    { expiresIn: '12h' }
  );
  res.json({ token, superUsuario: { id: superUsuario.id, nombre: superUsuario.nombre, email: superUsuario.email } });
});

plataformaRouter.use(requireSuperAdmin);

// El logo (base64) se excluye del listado a propósito — solo se pide en el
// detalle de una empresa, para no inflar cada carga del listado completo.
const EMPRESA_LIST_SELECT = {
  id: true, nombre: true, slug: true, dbName: true, estado: true,
  fechaAlta: true, fechaProximoPago: true, notas: true,
  _count: { select: { usuarios: true } },
};

plataformaRouter.get('/empresas', async (req, res) => {
  const empresas = await prismaPlataforma.empresa.findMany({
    select: EMPRESA_LIST_SELECT,
    orderBy: { fechaAlta: 'desc' },
  });
  res.json(empresas);
});

plataformaRouter.post('/empresas', async (req, res) => {
  try {
    const empresa = await provisionEmpresa(req.body);
    res.status(201).json(empresa);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'No se pudo crear la empresa.' });
  }
});

plataformaRouter.get('/empresas/:id', async (req, res) => {
  const empresa = await prismaPlataforma.empresa.findUnique({
    where: { id: req.params.id },
    include: { modulos: true, _count: { select: { usuarios: true } } },
  });
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
  res.json(empresa);
});

// Vista de solo lectura: se resuelve la base de esa empresa al vuelo, sin
// necesidad de que el súper administrador tenga sesión en esa empresa.
plataformaRouter.get('/empresas/:id/usuarios', async (req, res) => {
  const empresa = await prismaPlataforma.empresa.findUnique({ where: { id: req.params.id } });
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
  const tenantPrisma = getTenantPrisma(empresa.dbName);
  const usuarios = await tenantPrisma.usuario.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(usuarios);
});

async function cambiarEstado(req, res, nuevoEstado) {
  const empresa = await prismaPlataforma.empresa.findUnique({ where: { id: req.params.id } });
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
  const actualizada = await prismaPlataforma.empresa.update({ where: { id: req.params.id }, data: { estado: nuevoEstado } });
  invalidateEmpresaCache(actualizada.id);
  res.json(actualizada);
}

plataformaRouter.post('/empresas/:id/bloquear', (req, res) => cambiarEstado(req, res, 'Bloqueada'));
plataformaRouter.post('/empresas/:id/suspender', (req, res) => cambiarEstado(req, res, 'Suspendida'));
plataformaRouter.post('/empresas/:id/reactivar', (req, res) => cambiarEstado(req, res, 'Activa'));

// Borrado lógico: nunca se elimina la base de datos del tenant ni el
// registro de la empresa — los usuarios pierden acceso de inmediato, pero
// los datos se conservan. Se liberan sus correos del índice global para
// que, si corresponde, puedan usarse en otra empresa a futuro.
plataformaRouter.post('/empresas/:id/eliminar', async (req, res) => {
  const empresa = await prismaPlataforma.empresa.findUnique({ where: { id: req.params.id } });
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' });
  const actualizada = await prismaPlataforma.empresa.update({ where: { id: req.params.id }, data: { estado: 'Eliminada' } });
  await prismaPlataforma.usuarioIndex.deleteMany({ where: { empresaId: actualizada.id } });
  invalidateEmpresaCache(actualizada.id);
  res.json(actualizada);
});

// Se puede subir al crear la empresa (ver tenantProvisioning.js) o
// cambiarlo después desde aquí — mismo enfoque base64 que el resto de la app.
plataformaRouter.patch('/empresas/:id/logo', async (req, res) => {
  const { logo, logoMimeType } = req.body;
  const empresa = await prismaPlataforma.empresa.update({
    where: { id: req.params.id },
    data: { logo: logo || null, logoMimeType: logo ? logoMimeType || null : null },
  });
  invalidateEmpresaCache(empresa.id);
  res.json(empresa);
});

// --- Módulos habilitados por plan --------------------------------------

plataformaRouter.get('/empresas/:id/modulos', async (req, res) => {
  const filas = await prismaPlataforma.empresaModulo.findMany({ where: { empresaId: req.params.id } });
  const habilitados = new Set(filas.filter((f) => f.habilitado).map((f) => f.moduloId));
  res.json(TODOS_LOS_MODULOS.map((moduloId) => ({ moduloId, habilitado: habilitados.has(moduloId) })));
});

plataformaRouter.patch('/empresas/:id/modulos', async (req, res) => {
  const { moduloId, habilitado } = req.body;
  if (!TODOS_LOS_MODULOS.includes(moduloId)) return res.status(400).json({ error: 'Módulo inválido' });

  await prismaPlataforma.empresaModulo.upsert({
    where: { empresaId_moduloId: { empresaId: req.params.id, moduloId } },
    update: { habilitado: !!habilitado },
    create: { empresaId: req.params.id, moduloId, habilitado: !!habilitado },
  });
  invalidateEmpresaCache(req.params.id);

  const filas = await prismaPlataforma.empresaModulo.findMany({ where: { empresaId: req.params.id } });
  const habilitados = new Set(filas.filter((f) => f.habilitado).map((f) => f.moduloId));
  res.json(TODOS_LOS_MODULOS.map((m) => ({ moduloId: m, habilitado: habilitados.has(m) })));
});
