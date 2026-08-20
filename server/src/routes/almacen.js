import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const almacenRouter = Router();
almacenRouter.use(requireAuth);

almacenRouter.get('/items', async (req, res) => {
  const items = await prisma.item.findMany({
    include: { movimientos: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});

almacenRouter.post('/items', async (req, res) => {
  const { nombre, categoria, unidad, stock, stockMinimo, ubicacion } = req.body;
  const item = await prisma.item.create({
    data: {
      nombre,
      categoria,
      unidad,
      stock: Number(stock) || 0,
      stockMinimo: Number(stockMinimo) || 0,
      ubicacion,
      movimientos: { create: [{ fecha: new Date(), tipo: 'Entrada', cantidad: Number(stock) || 0, motivo: 'Carga inicial de inventario' }] },
    },
    include: { movimientos: true },
  });
  res.status(201).json(item);
});

almacenRouter.post('/items/:id/movimientos', async (req, res) => {
  const { tipo, cantidad, motivo } = req.body;
  const before = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Material no encontrado' });

  const delta = tipo === 'Entrada' ? Number(cantidad) : -Number(cantidad);
  const item = await prisma.item.update({
    where: { id: req.params.id },
    data: {
      stock: Math.max(0, before.stock + delta),
      movimientos: { create: [{ fecha: new Date(), tipo, cantidad: Number(cantidad), motivo: motivo || '—' }] },
    },
    include: { movimientos: { orderBy: { fecha: 'asc' } } },
  });
  res.json(item);
});

almacenRouter.get('/equipos', async (req, res) => {
  const equipos = await prisma.equipo.findMany({
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(equipos);
});

almacenRouter.post('/equipos/:id/asignar', async (req, res) => {
  const { tecnico } = req.body;
  const equipo = await prisma.equipo.update({
    where: { id: req.params.id },
    data: {
      estado: 'Asignado',
      tecnico,
      fechaAsignacion: new Date(),
      bitacora: { create: [{ fecha: new Date(), evento: 'Asignación', detalle: `Entregado a ${tecnico}.` }] },
    },
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(equipo);
});

almacenRouter.post('/equipos/:id/devolver', async (req, res) => {
  const before = await prisma.equipo.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Equipo no encontrado' });

  const equipo = await prisma.equipo.update({
    where: { id: req.params.id },
    data: {
      estado: 'En bodega',
      tecnico: null,
      bitacora: { create: [{ fecha: new Date(), evento: 'Devolución', detalle: `Devuelto por ${before.tecnico}.` }] },
    },
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(equipo);
});
