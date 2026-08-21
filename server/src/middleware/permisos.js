import { prisma } from '../prisma.js';

const CAMPOS = {
  ver: 'puedeVer',
  crear: 'puedeCrear',
  editar: 'puedeEditar',
  eliminar: 'puedeEliminar',
};

export async function tienePermiso(rol, moduloId, accion) {
  const campo = CAMPOS[accion];
  const permiso = await prisma.rolPermiso.findUnique({ where: { rol_moduloId: { rol, moduloId } } });
  return !!permiso?.[campo];
}

// Sin fila de permiso explícita para (rol, módulo) => acceso denegado por
// defecto. Se aplica después de requireAuth, ya que necesita req.user.rol.
export function requirePermiso(moduloId, accion) {
  return async (req, res, next) => {
    try {
      if (!(await tienePermiso(req.user.rol, moduloId, accion))) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
