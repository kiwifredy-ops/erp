import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prismaPlataforma } from '../prismaPlataforma.js';
import { getTenantPrisma } from '../tenantPrismaCache.js';
import { requireAuth } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';

export const authRouter = Router();

async function getPermisos(prismaClient, rol) {
  return prismaClient.rolPermiso.findMany({ where: { rol } });
}

async function getModulosHabilitados(empresaId) {
  const filas = await prismaPlataforma.empresaModulo.findMany({ where: { empresaId, habilitado: true } });
  return filas.map((f) => f.moduloId);
}

const MENSAJE_ESTADO = {
  Bloqueada: 'El acceso de tu empresa ha sido bloqueado. Contacta a soporte.',
  Suspendida: 'Tu empresa tiene el acceso suspendido por pago pendiente. Contacta a tu administrador.',
};

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña son requeridos' });

  const emailNormalizado = email.toLowerCase();

  // El correo es único en toda la plataforma — este índice resuelve a qué
  // empresa (y por lo tanto, a qué base de datos) pertenece antes de poder
  // validar la contraseña, que vive en la base de esa empresa.
  const indice = await prismaPlataforma.usuarioIndex.findUnique({ where: { email: emailNormalizado } });
  if (!indice) return res.status(401).json({ error: 'Credenciales inválidas' });

  const empresa = await prismaPlataforma.empresa.findUnique({ where: { id: indice.empresaId } });
  // "Eliminada" se trata igual que "no existe": no se revela que el correo
  // perteneció alguna vez a una empresa.
  if (!empresa || empresa.estado === 'Eliminada') return res.status(401).json({ error: 'Credenciales inválidas' });
  if (empresa.estado !== 'Activa') {
    return res.status(401).json({ error: MENSAJE_ESTADO[empresa.estado] || 'Tu empresa no tiene acceso activo. Contacta a soporte.' });
  }

  const tenantPrisma = getTenantPrisma(empresa.dbName);
  const usuario = await tenantPrisma.usuario.findUnique({ where: { email: emailNormalizado } });
  if (!usuario || !usuario.activo) return res.status(401).json({ error: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, usuario.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre, empresaId: empresa.id },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  const [permisos, modulosHabilitados] = await Promise.all([
    getPermisos(tenantPrisma, usuario.rol),
    getModulosHabilitados(empresa.id),
  ]);
  res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    permisos,
    modulosHabilitados,
    empresa: { nombre: empresa.nombre, logo: empresa.logo },
  });
});

authRouter.get('/me', requireAuth, resolveTenant, async (req, res) => {
  const permisos = await getPermisos(req.prisma, req.user.rol);
  res.json({
    usuario: req.user,
    permisos,
    modulosHabilitados: [...req.empresaModulos],
    empresa: { nombre: req.empresa.nombre, logo: req.empresa.logo },
  });
});
