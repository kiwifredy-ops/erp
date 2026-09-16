import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requirePermiso } from '../middleware/permisos.js';
import { resolveTenant } from '../middleware/tenant.js';

export const prevencionRouter = Router();
prevencionRouter.use(requireAuth, resolveTenant);

const V = requirePermiso('prevencion', 'ver');
const C = requirePermiso('prevencion', 'crear');
const E = requirePermiso('prevencion', 'editar');
const D = requirePermiso('prevencion', 'eliminar');

const DIAS_ALERTA_VENCIMIENTO = 30;

function diasRestantes(fecha) {
  return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
}

// --- Documentos de la empresa -------------------------------------------

const DOC_EMPRESA_SELECT = {
  id: true, tipo: true, nombre: true, nombreArchivo: true,
  fechaEmision: true, fechaVencimiento: true, notas: true, createdAt: true,
};

prevencionRouter.get('/documentos-empresa', V, async (req, res) => {
  const documentos = await req.prisma.documentoPrevencion.findMany({
    select: DOC_EMPRESA_SELECT,
    orderBy: { fechaEmision: 'desc' },
  });
  res.json(documentos);
});

prevencionRouter.post('/documentos-empresa', C, async (req, res) => {
  const { tipo, nombre, fechaEmision, fechaVencimiento, notas, nombreArchivo, mimeType, contenido } = req.body;
  if (!tipo || !nombre || !fechaEmision || !nombreArchivo || !contenido) {
    return res.status(400).json({ error: 'Faltan datos del documento' });
  }
  const documento = await req.prisma.documentoPrevencion.create({
    data: {
      tipo, nombre, nombreArchivo, mimeType: mimeType || 'application/octet-stream', contenido,
      fechaEmision: new Date(fechaEmision),
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      notas: notas || null,
    },
    select: DOC_EMPRESA_SELECT,
  });
  res.status(201).json(documento);
});

prevencionRouter.get('/documentos-empresa/:id/archivo', V, async (req, res) => {
  const documento = await req.prisma.documentoPrevencion.findUnique({ where: { id: req.params.id } });
  if (!documento) return res.status(404).json({ error: 'Documento no encontrado' });
  res.json({ contenido: documento.contenido, mimeType: documento.mimeType, nombreArchivo: documento.nombreArchivo });
});

prevencionRouter.delete('/documentos-empresa/:id', D, async (req, res) => {
  await req.prisma.documentoPrevencion.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// --- Documentos por trabajador -------------------------------------------

const DOC_PERSONAL_SELECT = {
  id: true, empleado: true, tipo: true, nombreArchivo: true,
  fecha: true, fechaVencimiento: true, notas: true, createdAt: true,
};

prevencionRouter.get('/documentos-personal', V, async (req, res) => {
  const { empleado } = req.query;
  const documentos = await req.prisma.documentoSeguridadEmpleado.findMany({
    where: empleado ? { empleado } : undefined,
    select: DOC_PERSONAL_SELECT,
    orderBy: { fecha: 'desc' },
  });
  res.json(documentos);
});

prevencionRouter.post('/documentos-personal', C, async (req, res) => {
  const { empleado, tipo, fecha, fechaVencimiento, notas, nombreArchivo, mimeType, contenido } = req.body;
  if (!empleado || !tipo || !fecha || !nombreArchivo || !contenido) {
    return res.status(400).json({ error: 'Faltan datos del documento' });
  }
  const documento = await req.prisma.documentoSeguridadEmpleado.create({
    data: {
      empleado, tipo, nombreArchivo, mimeType: mimeType || 'application/octet-stream', contenido,
      fecha: new Date(fecha),
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      notas: notas || null,
    },
    select: DOC_PERSONAL_SELECT,
  });
  res.status(201).json(documento);
});

prevencionRouter.get('/documentos-personal/:id/archivo', V, async (req, res) => {
  const documento = await req.prisma.documentoSeguridadEmpleado.findUnique({ where: { id: req.params.id } });
  if (!documento) return res.status(404).json({ error: 'Documento no encontrado' });
  res.json({ contenido: documento.contenido, mimeType: documento.mimeType, nombreArchivo: documento.nombreArchivo });
});

prevencionRouter.delete('/documentos-personal/:id', D, async (req, res) => {
  await req.prisma.documentoSeguridadEmpleado.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// --- Accidentes e incidentes ---------------------------------------------

const NEXT_ESTADO = {
  'En investigación': ['Cerrado'],
  Cerrado: [],
};

const ACCIDENTE_SELECT = {
  id: true, folio: true, empleado: true, fecha: true, tipo: true, gravedad: true,
  lugar: true, descripcion: true, estado: true, informeNombre: true, createdAt: true,
  bitacora: { orderBy: { fecha: 'asc' } },
};

async function nextFolio(prismaClient) {
  const count = await prismaClient.accidenteIncidente.count();
  return `AC${String(count + 1).padStart(4, '0')}`;
}

prevencionRouter.get('/accidentes', V, async (req, res) => {
  const accidentes = await req.prisma.accidenteIncidente.findMany({
    select: ACCIDENTE_SELECT,
    orderBy: { fecha: 'desc' },
  });
  res.json(accidentes);
});

prevencionRouter.post('/accidentes', C, async (req, res) => {
  const { empleado, fecha, tipo, gravedad, lugar, descripcion, informeNombre, informeMimeType, informeContenido } = req.body;
  if (!fecha || !tipo || !gravedad || !descripcion) return res.status(400).json({ error: 'Faltan datos del accidente/incidente' });

  const folio = await nextFolio(req.prisma);
  const accidente = await req.prisma.accidenteIncidente.create({
    data: {
      folio, empleado: empleado || null, fecha: new Date(fecha), tipo, gravedad,
      lugar: lugar || null, descripcion,
      informeNombre: informeNombre || null, informeMimeType: informeMimeType || null, informeContenido: informeContenido || null,
      bitacora: { create: [{ fecha: new Date(), evento: 'Registro creado', detalle: 'En investigación.' }] },
    },
    select: ACCIDENTE_SELECT,
  });
  res.status(201).json(accidente);
});

prevencionRouter.get('/accidentes/:id/informe', V, async (req, res) => {
  const accidente = await req.prisma.accidenteIncidente.findUnique({ where: { id: req.params.id } });
  if (!accidente || !accidente.informeContenido) return res.status(404).json({ error: 'Informe no encontrado' });
  res.json({ contenido: accidente.informeContenido, mimeType: accidente.informeMimeType, nombreArchivo: accidente.informeNombre });
});

prevencionRouter.post('/accidentes/:id/estado', E, async (req, res) => {
  const { estado, motivo } = req.body;
  const before = await req.prisma.accidenteIncidente.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Registro no encontrado' });
  if (!NEXT_ESTADO[before.estado]?.includes(estado)) {
    return res.status(400).json({ error: `Transición de estado inválida: ${before.estado} → ${estado}` });
  }

  const accidente = await req.prisma.accidenteIncidente.update({
    where: { id: req.params.id },
    data: { estado, bitacora: { create: [{ fecha: new Date(), evento: `Cambio de estado → ${estado}`, detalle: motivo || '—' }] } },
    select: ACCIDENTE_SELECT,
  });
  res.json(accidente);
});

// --- Alertas de vencimiento -----------------------------------------------

prevencionRouter.get('/alertas', V, async (req, res) => {
  const [documentosEmpresa, documentosPersonal] = await Promise.all([
    req.prisma.documentoPrevencion.findMany({ where: { fechaVencimiento: { not: null } }, select: { id: true, tipo: true, nombre: true, fechaVencimiento: true } }),
    req.prisma.documentoSeguridadEmpleado.findMany({ where: { fechaVencimiento: { not: null } }, select: { id: true, empleado: true, tipo: true, fechaVencimiento: true } }),
  ]);

  const empresaPorVencer = documentosEmpresa
    .map((d) => ({ ...d, diasRestantes: diasRestantes(d.fechaVencimiento) }))
    .filter((d) => d.diasRestantes <= DIAS_ALERTA_VENCIMIENTO);
  const personalPorVencer = documentosPersonal
    .map((d) => ({ ...d, diasRestantes: diasRestantes(d.fechaVencimiento) }))
    .filter((d) => d.diasRestantes <= DIAS_ALERTA_VENCIMIENTO);

  res.json({ empresaPorVencer, personalPorVencer });
});
