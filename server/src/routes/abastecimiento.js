import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermiso } from '../middleware/permisos.js';

export const abastecimientoRouter = Router();
abastecimientoRouter.use(requireAuth);

const V = requirePermiso('abastecimiento', 'ver');
const C = requirePermiso('abastecimiento', 'crear');
const E = requirePermiso('abastecimiento', 'editar');

const NEXT_ESTADO = {
  Solicitada: ['Aprobada', 'Rechazada'],
  Aprobada: ['En tránsito'],
  'En tránsito': ['Recibida'],
  Recibida: [],
  Rechazada: [],
};

// El contenido del documento (base64) se pide aparte on-demand, no en el listado.
const ORDEN_INCLUDE = {
  items: true,
  bitacora: { orderBy: { fecha: 'asc' } },
};
const ORDEN_SELECT_SIN_DOC = {
  id: true, folio: true, proveedor: true, fecha: true, estado: true, createdAt: true,
  fechaEntregaEstimada: true, calificacionProveedor: true, documentoNombre: true,
  items: true, bitacora: { orderBy: { fecha: 'asc' } },
};

function diasHasta(fecha) {
  if (!fecha) return null;
  const ms = new Date(fecha).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

async function nextFolio() {
  const count = await prisma.ordenCompra.count();
  return `OC${String(count + 1).padStart(4, '0')}`;
}

abastecimientoRouter.get('/proveedores', V, async (req, res) => {
  const proveedores = await prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } });
  const ordenes = await prisma.ordenCompra.findMany({ where: { calificacionProveedor: { not: null } } });
  const conCalificacion = proveedores.map((p) => {
    const propias = ordenes.filter((o) => o.proveedor === p.nombre);
    const promedio = propias.length ? propias.reduce((s, o) => s + o.calificacionProveedor, 0) / propias.length : null;
    return { ...p, calificacionPromedio: promedio, ordenesCalificadas: propias.length };
  });
  res.json(conCalificacion);
});

abastecimientoRouter.post('/proveedores', C, async (req, res) => {
  const { nombre, rubro, contacto, telefono } = req.body;
  const proveedor = await prisma.proveedor.create({ data: { nombre, rubro, contacto, telefono } });
  res.status(201).json(proveedor);
});

abastecimientoRouter.post('/proveedores/:id/toggle', E, async (req, res) => {
  const before = await prisma.proveedor.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Proveedor no encontrado' });
  const proveedor = await prisma.proveedor.update({ where: { id: req.params.id }, data: { activo: !before.activo } });
  res.json(proveedor);
});

abastecimientoRouter.get('/ordenes', V, async (req, res) => {
  const ordenes = await prisma.ordenCompra.findMany({
    select: ORDEN_SELECT_SIN_DOC,
    orderBy: { createdAt: 'desc' },
  });
  res.json(ordenes);
});

abastecimientoRouter.get('/ordenes/alertas', V, async (req, res) => {
  const ordenes = await prisma.ordenCompra.findMany({ where: { estado: 'En tránsito' } });
  const atrasadas = ordenes
    .filter((o) => o.fechaEntregaEstimada)
    .map((o) => ({ ...o, diasRestantes: diasHasta(o.fechaEntregaEstimada) }))
    .filter((o) => o.diasRestantes <= 0)
    .map((o) => ({ id: o.id, folio: o.folio, proveedor: o.proveedor, fecha: o.fechaEntregaEstimada, diasRestantes: o.diasRestantes }));
  res.json({ atrasadas });
});

abastecimientoRouter.post('/ordenes', C, async (req, res) => {
  const { proveedor, fecha, fechaEntregaEstimada, items } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'La orden debe tener al menos un ítem' });

  const folio = await nextFolio();
  const orden = await prisma.ordenCompra.create({
    data: {
      folio,
      proveedor,
      fecha: new Date(fecha),
      fechaEntregaEstimada: fechaEntregaEstimada ? new Date(fechaEntregaEstimada) : null,
      items: { create: items.map((it) => ({ descripcion: it.descripcion, cantidad: Number(it.cantidad), precioUnitario: Number(it.precioUnitario) })) },
      bitacora: { create: [{ fecha: new Date(fecha), evento: 'Orden solicitada', detalle: `Solicitada a ${proveedor}.` }] },
    },
    include: ORDEN_INCLUDE,
  });
  res.status(201).json(orden);
});

abastecimientoRouter.post('/ordenes/:id/estado', E, async (req, res) => {
  const { estado, motivo, calificacion } = req.body;
  const before = await prisma.ordenCompra.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Orden no encontrada' });
  if (!NEXT_ESTADO[before.estado]?.includes(estado)) {
    return res.status(400).json({ error: `Transición de estado inválida: ${before.estado} → ${estado}` });
  }
  if (estado === 'Recibida' && !calificacion) {
    return res.status(400).json({ error: 'Debes calificar al proveedor (1 a 5) al recibir la orden' });
  }

  const orden = await prisma.ordenCompra.update({
    where: { id: req.params.id },
    data: {
      estado,
      calificacionProveedor: estado === 'Recibida' ? Number(calificacion) : undefined,
      bitacora: { create: [{ fecha: new Date(), evento: `Cambio de estado → ${estado}`, detalle: motivo || '—' }] },
    },
    include: ORDEN_INCLUDE,
  });
  res.json(orden);
});

abastecimientoRouter.post('/ordenes/:id/documento', E, async (req, res) => {
  const { nombreArchivo, mimeType, contenido } = req.body;
  if (!nombreArchivo || !mimeType || !contenido) return res.status(400).json({ error: 'Faltan datos del documento' });

  const orden = await prisma.ordenCompra.update({
    where: { id: req.params.id },
    data: {
      documentoNombre: nombreArchivo,
      documentoMimeType: mimeType,
      documentoContenido: contenido,
      bitacora: { create: [{ fecha: new Date(), evento: 'Documento adjuntado', detalle: nombreArchivo }] },
    },
    include: ORDEN_INCLUDE,
  });
  res.json(orden);
});

abastecimientoRouter.get('/ordenes/:id/documento', V, async (req, res) => {
  const orden = await prisma.ordenCompra.findUnique({ where: { id: req.params.id } });
  if (!orden || !orden.documentoContenido) return res.status(404).json({ error: 'Documento no encontrado' });
  res.json({ contenido: orden.documentoContenido, nombreArchivo: orden.documentoNombre, mimeType: orden.documentoMimeType });
});
