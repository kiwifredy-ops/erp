import { prismaPlataforma } from '../prismaPlataforma.js';
import { getTenantPrisma } from '../tenantPrismaCache.js';

const ESTADO_CACHE_TTL_MS = 60_000;
const cache = new Map(); // empresaId -> { empresa, modulos: Set<moduloId>, expiresAt }

function extraerNombreBase(databaseUrl) {
  const match = databaseUrl?.match(/\/([^/?]+)(\?.*)?$/);
  return match ? match[1] : null;
}

// Compatibilidad temporal: un JWT emitido antes de que el login incluyera
// "empresaId" no lo trae en el payload — se resuelve la empresa cuya base
// de datos es la misma que usa hoy la app (DATABASE_URL), para no invalidar
// sesiones ya abiertas. Se resuelve una sola vez por proceso.
let empresaPorDefectoIdPromise = null;
function resolverEmpresaPorDefectoId() {
  if (!empresaPorDefectoIdPromise) {
    empresaPorDefectoIdPromise = (async () => {
      const dbName = extraerNombreBase(process.env.DATABASE_URL);
      if (!dbName) return null;
      const empresa = await prismaPlataforma.empresa.findUnique({ where: { dbName } });
      return empresa?.id ?? null;
    })();
  }
  return empresaPorDefectoIdPromise;
}

async function resolverEmpresa(empresaId) {
  const cacheado = cache.get(empresaId);
  if (cacheado && cacheado.expiresAt > Date.now()) return cacheado;

  const empresa = await prismaPlataforma.empresa.findUnique({ where: { id: empresaId } });
  const filas = empresa
    ? await prismaPlataforma.empresaModulo.findMany({ where: { empresaId, habilitado: true } })
    : [];
  const entrada = { empresa, modulos: new Set(filas.map((f) => f.moduloId)), expiresAt: Date.now() + ESTADO_CACHE_TTL_MS };
  cache.set(empresaId, entrada);
  return entrada;
}

// Se llama desde el panel de plataforma justo después de bloquear/suspender/
// reactivar una empresa o de cambiar sus módulos habilitados, para que el
// cambio tome efecto de inmediato en vez de esperar el TTL de la caché.
export function invalidateEmpresaCache(empresaId) {
  cache.delete(empresaId);
}

// Resuelve la base de datos del tenant del usuario autenticado y la cuelga
// en req.prisma; también cuelga en req.empresaModulos el set de módulos que
// esa empresa tiene habilitados por su plan, para que permisos.js los exija
// junto con el permiso del rol. Se aplica después de requireAuth.
export async function resolveTenant(req, res, next) {
  try {
    const empresaId = req.user.empresaId || (await resolverEmpresaPorDefectoId());
    if (!empresaId) {
      return res.status(401).json({ error: 'No se pudo determinar la empresa de tu cuenta.' });
    }

    const { empresa, modulos } = await resolverEmpresa(empresaId);
    if (!empresa || empresa.estado !== 'Activa') {
      return res.status(401).json({ error: 'Tu empresa no tiene acceso activo. Contacta a soporte.' });
    }

    req.user.empresaId = empresaId;
    req.prisma = getTenantPrisma(empresa.dbName);
    req.empresaModulos = modulos;
    req.empresa = { nombre: empresa.nombre, logo: empresa.logo, logoMimeType: empresa.logoMimeType };
    next();
  } catch (err) {
    next(err);
  }
}
