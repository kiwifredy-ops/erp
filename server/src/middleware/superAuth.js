import jwt from 'jsonwebtoken';

// Autenticación completamente separada de requireAuth (usuarios de una
// empresa): usa un secreto distinto (JWT_SECRET_PLATAFORMA) y exige el
// claim "tipo: 'plataforma'" — un token de un usuario normal nunca puede
// usarse aquí, ni al revés.
export function requireSuperAdmin(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_PLATAFORMA);
    if (payload.tipo !== 'plataforma') return res.status(401).json({ error: 'Token inválido' });
    req.superUser = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
