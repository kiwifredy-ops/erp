import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

async function getPermisos(rol) {
  return prisma.rolPermiso.findMany({ where: { rol } });
}

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña son requeridos' });

  const usuario = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
  if (!usuario || !usuario.activo) return res.status(401).json({ error: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, usuario.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  const permisos = await getPermisos(usuario.rol);
  res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }, permisos });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const permisos = await getPermisos(req.user.rol);
  res.json({ usuario: req.user, permisos });
});
