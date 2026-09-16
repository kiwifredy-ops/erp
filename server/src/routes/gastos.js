import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requirePermiso, requireAlguno, tienePermiso } from '../middleware/permisos.js';
import { resolveTenant } from '../middleware/tenant.js';
import { validarRut, normalizarRut } from '../lib/rut.js';

export const gastosRouter = Router();
gastosRouter.use(requireAuth, resolveTenant);

const V = requirePermiso('gastos', 'ver');
const C = requirePermiso('gastos', 'crear');
const E = requirePermiso('gastos', 'editar');
const VoC = requireAlguno('gastos', ['ver', 'crear']);

// Solo factura (33/46) da derecho a crédito fiscal de IVA — una boleta (39)
// no, aunque venga desglosada. Exentas no tienen IVA que desglosar.
const TIPOS_IVA_AFECTO = ['Factura electrónica', 'Factura de compra'];
const TIPOS_EXENTO = ['Factura exenta', 'Boleta exenta'];

// Se recalcula siempre en el backend a partir de monto + tipoDocumento —
// nunca se confía en montoNeto/iva/ivaRecuperable que mande el cliente.
function calcularDatosTributarios(monto, tipoDocumento) {
  if (TIPOS_IVA_AFECTO.includes(tipoDocumento)) {
    const montoNeto = Math.round(monto / 1.19);
    return { montoNeto, iva: monto - montoNeto, ivaRecuperable: true };
  }
  if (TIPOS_EXENTO.includes(tipoDocumento)) {
    return { montoNeto: monto, iva: 0, ivaRecuperable: false };
  }
  return { montoNeto: null, iva: null, ivaRecuperable: false };
}

const NEXT_ESTADO = {
  Enviada: ['En revisión', 'Rechazada'],
  'En revisión': ['Aprobada', 'Rechazada'],
  Aprobada: ['Pagada'],
  Rechazada: [],
  Pagada: [],
};

// No se incluye el contenido del comprobante (base64) en el listado — se pide
// aparte on-demand para no inflar cada carga de la lista de rendiciones.
const LINEA_SELECT = {
  id: true,
  categoria: true,
  monto: true,
  descripcion: true,
  fecha: true,
  kilometros: true,
  comprobanteNombre: true,
  tipoDocumento: true,
  rutProveedor: true,
  montoNeto: true,
  iva: true,
  ivaRecuperable: true,
};

async function nextFolio(prismaClient) {
  const count = await prismaClient.rendicion.count();
  return `RG${String(count + 1).padStart(4, '0')}`;
}

gastosRouter.get('/rendiciones', V, async (req, res) => {
  const rendiciones = await req.prisma.rendicion.findMany({
    include: { lineas: { select: LINEA_SELECT }, bitacora: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rendiciones);
});

// Autoservicio: solo las rendiciones enviadas por el usuario logueado.
gastosRouter.get('/rendiciones/mias', VoC, async (req, res) => {
  const rendiciones = await req.prisma.rendicion.findMany({
    where: { tecnico: req.user.nombre },
    include: { lineas: { select: LINEA_SELECT }, bitacora: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rendiciones);
});

gastosRouter.post('/rendiciones', C, async (req, res) => {
  const { fecha, lineas } = req.body;
  // Sin permiso de "ver" (visibilidad completa), el técnico solo puede
  // enviar rendiciones a su propio nombre — no puede suplantar a otro.
  const tecnico = (await tienePermiso(req, 'gastos', 'ver')) ? req.body.tecnico : req.user.nombre;
  if (!lineas?.length) return res.status(400).json({ error: 'La rendición debe tener al menos un ítem' });

  for (const l of lineas) {
    if (l.rutProveedor && !validarRut(l.rutProveedor)) {
      return res.status(400).json({ error: `RUT inválido: ${l.rutProveedor}` });
    }
  }

  const folio = await nextFolio(req.prisma);
  const rendicion = await req.prisma.rendicion.create({
    data: {
      folio,
      tecnico,
      fecha: new Date(fecha),
      lineas: {
        create: lineas.map((l) => {
          const monto = Number(l.monto);
          const { montoNeto, iva, ivaRecuperable } = calcularDatosTributarios(monto, l.tipoDocumento);
          return {
            categoria: l.categoria,
            monto,
            descripcion: l.descripcion,
            fecha: new Date(l.fecha),
            kilometros: l.kilometros ? Number(l.kilometros) : null,
            comprobante: l.comprobante || null,
            comprobanteNombre: l.comprobanteNombre || null,
            tipoDocumento: l.tipoDocumento || 'Sin documento',
            rutProveedor: l.rutProveedor ? normalizarRut(l.rutProveedor) : null,
            montoNeto,
            iva,
            ivaRecuperable,
          };
        }),
      },
      bitacora: { create: [{ fecha: new Date(fecha), evento: 'Rendición enviada', detalle: `Enviada por ${tecnico}.` }] },
    },
    include: { lineas: { select: LINEA_SELECT }, bitacora: true },
  });
  res.status(201).json(rendicion);
});

gastosRouter.get('/rendiciones/:id/lineas/:lineaId/comprobante', VoC, async (req, res) => {
  const linea = await req.prisma.rendicionLinea.findFirst({
    where: { id: req.params.lineaId, rendicionId: req.params.id },
    include: { rendicion: { select: { tecnico: true } } },
  });
  if (!linea || !linea.comprobante) return res.status(404).json({ error: 'Comprobante no encontrado' });
  if (!(await tienePermiso(req, 'gastos', 'ver')) && linea.rendicion.tecnico !== req.user.nombre) {
    return res.status(403).json({ error: 'No tienes permiso para ver este comprobante.' });
  }
  res.json({ comprobante: linea.comprobante, comprobanteNombre: linea.comprobanteNombre });
});

gastosRouter.post('/rendiciones/:id/estado', E, async (req, res) => {
  const { estado, motivo } = req.body;
  const before = await req.prisma.rendicion.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Rendición no encontrada' });
  if (!NEXT_ESTADO[before.estado]?.includes(estado)) {
    return res.status(400).json({ error: `Transición de estado inválida: ${before.estado} → ${estado}` });
  }

  const rendicion = await req.prisma.rendicion.update({
    where: { id: req.params.id },
    data: { estado, bitacora: { create: [{ fecha: new Date(), evento: `Cambio de estado → ${estado}`, detalle: motivo || '—' }] } },
    include: { lineas: { select: LINEA_SELECT }, bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(rendicion);
});
