const CAMPOS = {
  ver: 'puedeVer',
  crear: 'puedeCrear',
  editar: 'puedeEditar',
  eliminar: 'puedeEliminar',
};

// Recibe el request (no solo el rol) porque necesita dos cosas que dependen
// del tenant resuelto por resolveTenant: la base de datos correcta
// (req.prisma) y los módulos habilitados por el plan de esa empresa
// (req.empresaModulos) — un módulo apagado por plan queda bloqueado aunque
// el rol tenga permiso "ver" completo dentro de su propia empresa.
export async function tienePermiso(req, moduloId, accion) {
  if (!req.empresaModulos.has(moduloId)) return false;
  const campo = CAMPOS[accion];
  const permiso = await req.prisma.rolPermiso.findUnique({ where: { rol_moduloId: { rol: req.user.rol, moduloId } } });
  return !!permiso?.[campo];
}

// Sin fila de permiso explícita para (rol, módulo) => acceso denegado por
// defecto. Se aplica después de requireAuth + resolveTenant.
export function requirePermiso(moduloId, accion) {
  return async (req, res, next) => {
    try {
      if (!(await tienePermiso(req, moduloId, accion))) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Pasa si el rol tiene CUALQUIERA de las acciones listadas. Se usa para
// endpoints de autoservicio ("mis registros") a los que puede entrar tanto
// quien tiene visibilidad completa como quien solo tiene un permiso de
// autoservicio (crear/editar sin ver) — el propio endpoint se encarga de
// acotar los datos a lo que corresponde.
export function requireAlguno(moduloId, acciones) {
  return async (req, res, next) => {
    try {
      for (const accion of acciones) {
        if (await tienePermiso(req, moduloId, accion)) return next();
      }
      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
    } catch (err) {
      next(err);
    }
  };
}
