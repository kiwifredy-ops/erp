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
