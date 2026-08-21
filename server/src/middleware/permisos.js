import { prisma } from '../prisma.js';

const CAMPOS = {
  ver: 'puedeVer',
  crear: 'puedeCrear',
  editar: 'puedeEditar',
  eliminar: 'puedeEliminar',
};

// Sin fila de permiso explícita para (rol, módulo) => acceso denegado por
// defecto. Se aplica después de requireAuth, ya que necesita req.user.rol.
export function requirePermiso(moduloId, accion) {
  const campo = CAMPOS[accion];
  return async (req, res, next) => {
    try {
      const permiso = await prisma.rolPermiso.findUnique({
        where: { rol_moduloId: { rol: req.user.rol, moduloId } },
      });
      if (!permiso || !permiso[campo]) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
