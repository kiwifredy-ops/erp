import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const gastosRouter = Router();
gastosRouter.use(requireAuth);

const NEXT_ESTADO = {
  Enviada: ['En revisión', 'Rechazada'],
  'En revisión': ['Aprobada', 'Rechazada'],
  Aprobada: ['Pagada'],
  Rechazada: [],
  Pagada: [],
};

async function nextFolio() {
  const count = await prisma.rendicion.count();
  return `RG${String(count + 1).padStart(4, '0')}`;
}

gastosRouter.get('/rendiciones', async (req, res) => {
  const rendiciones = await prisma.rendicion.findMany({
    include: { lineas: true, bitacora: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rendiciones);
});

gastosRouter.post('/rendiciones', async (req, res) => {
  const { tecnico, fecha, lineas } = req.body;
  if (!lineas?.length) return res.status(400).json({ error: 'La rendición debe tener al menos un ítem' });

  const folio = await nextFolio();
  const rendicion = await prisma.rendicion.create({
    data: {
      folio,
      tecnico,
      fecha: new Date(fecha),
      lineas: { create: lineas.map((l) => ({ categoria: l.categoria, monto: Number(l.monto), descripcion: l.descripcion, fecha: new Date(l.fecha) })) },
      bitacora: { create: [{ fecha: new Date(fecha), evento: 'Rendición enviada', detalle: `Enviada por ${tecnico}.` }] },
    },
    include: { lineas: true, bitacora: true },
  });
  res.status(201).json(rendicion);
});

gastosRouter.post('/rendiciones/:id/estado', async (req, res) => {
  const { estado, motivo } = req.body;
  const before = await prisma.rendicion.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Rendición no encontrada' });
  if (!NEXT_ESTADO[before.estado]?.includes(estado)) {
    return res.status(400).json({ error: `Transición de estado inválida: ${before.estado} → ${estado}` });
  }

  const rendicion = await prisma.rendicion.update({
    where: { id: req.params.id },
    data: { estado, bitacora: { create: [{ fecha: new Date(), evento: `Cambio de estado → ${estado}`, detalle: motivo || '—' }] } },
    include: { lineas: true, bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(rendicion);
});
