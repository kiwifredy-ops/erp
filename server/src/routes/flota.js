import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const flotaRouter = Router();
flotaRouter.use(requireAuth);

const NEXT_ESTADO = {
  Disponible: ['Asignado', 'En mantención', 'Fuera de servicio'],
  Asignado: ['Disponible', 'En mantención'],
  'En mantención': ['Disponible', 'Fuera de servicio'],
  'Fuera de servicio': ['En mantención'],
};

flotaRouter.get('/vehiculos', async (req, res) => {
  const vehiculos = await prisma.vehiculo.findMany({
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(vehiculos);
});

function diasHasta(fecha) {
  if (!fecha) return null;
  const ms = new Date(fecha).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

const DOCS_VEHICULO = [
  { campo: 'vencimientoRevisionTecnica', nombre: 'Revisión técnica' },
  { campo: 'vencimientoSeguro', nombre: 'Seguro' },
  { campo: 'vencimientoPermisoCirculacion', nombre: 'Permiso de circulación' },
];

flotaRouter.get('/vehiculos/alertas', async (req, res) => {
  const vehiculos = await prisma.vehiculo.findMany({ where: { estado: { not: 'Fuera de servicio' } } });
  const alertas = [];
  for (const v of vehiculos) {
    for (const doc of DOCS_VEHICULO) {
      const dias = diasHasta(v[doc.campo]);
      if (dias !== null && dias <= 30) {
        alertas.push({ id: v.id, patente: v.patente, documento: doc.nombre, fecha: v[doc.campo], diasRestantes: dias });
      }
    }
  }
  res.json({ documentosPorVencer: alertas });
});

flotaRouter.post('/vehiculos', async (req, res) => {
  const { patente, marca, modelo, anio, tipo, kilometraje, proximaMantencionKm } = req.body;
  const vehiculo = await prisma.vehiculo.create({
    data: {
      patente: patente.toUpperCase(),
      marca,
      modelo,
      anio: Number(anio),
      tipo,
      kilometraje: Number(kilometraje) || 0,
      proximaMantencionKm: Number(proximaMantencionKm) || 10000,
      bitacora: { create: [{ fecha: new Date(), evento: 'Registro', detalle: 'Vehículo incorporado a la flota.' }] },
    },
    include: { bitacora: true },
  });
  res.status(201).json(vehiculo);
});

flotaRouter.patch('/vehiculos/:id', async (req, res) => {
  const data = {};
  for (const doc of DOCS_VEHICULO) {
    if (req.body[doc.campo] !== undefined) data[doc.campo] = req.body[doc.campo] ? new Date(req.body[doc.campo]) : null;
  }
  const vehiculo = await prisma.vehiculo.update({
    where: { id: req.params.id },
    data: { ...data, bitacora: { create: [{ fecha: new Date(), evento: 'Actualización de documentación', detalle: 'Se actualizaron fechas de documentos del vehículo.' }] } },
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(vehiculo);
});

flotaRouter.post('/vehiculos/:id/asignar', async (req, res) => {
  const { tecnico } = req.body;
  const vehiculo = await prisma.vehiculo.update({
    where: { id: req.params.id },
    data: {
      estado: 'Asignado',
      tecnico,
      bitacora: { create: [{ fecha: new Date(), evento: 'Asignación', detalle: `Asignado a ${tecnico}.` }] },
    },
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(vehiculo);
});

flotaRouter.post('/vehiculos/:id/estado', async (req, res) => {
  const { estado, motivo } = req.body;
  const before = await prisma.vehiculo.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Vehículo no encontrado' });
  if (!NEXT_ESTADO[before.estado]?.includes(estado)) {
    return res.status(400).json({ error: `Transición de estado inválida: ${before.estado} → ${estado}` });
  }

  const vehiculo = await prisma.vehiculo.update({
    where: { id: req.params.id },
    data: {
      estado,
      tecnico: estado === 'Asignado' ? before.tecnico : null,
      bitacora: { create: [{ fecha: new Date(), evento: `Cambio de estado → ${estado}`, detalle: motivo || '—' }] },
    },
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(vehiculo);
});

flotaRouter.post('/vehiculos/:id/mantencion', async (req, res) => {
  const { kilometraje, detalle } = req.body;
  const km = Number(kilometraje);
  const vehiculo = await prisma.vehiculo.update({
    where: { id: req.params.id },
    data: {
      kilometraje: km,
      proximaMantencionKm: km + 10000,
      bitacora: { create: [{ fecha: new Date(), evento: 'Mantención registrada', detalle: detalle || `Servicio realizado a los ${km} km.` }] },
    },
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(vehiculo);
});
