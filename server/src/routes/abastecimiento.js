import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const abastecimientoRouter = Router();
abastecimientoRouter.use(requireAuth);

const NEXT_ESTADO = {
  Solicitada: ['Aprobada', 'Rechazada'],
  Aprobada: ['En tránsito'],
  'En tránsito': ['Recibida'],
  Recibida: [],
  Rechazada: [],
};

async function nextFolio() {
  const count = await prisma.ordenCompra.count();
  return `OC${String(count + 1).padStart(4, '0')}`;
}

abastecimientoRouter.get('/proveedores', async (req, res) => {
  res.json(await prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } }));
});

abastecimientoRouter.post('/proveedores', async (req, res) => {
  const { nombre, rubro, contacto, telefono } = req.body;
  const proveedor = await prisma.proveedor.create({ data: { nombre, rubro, contacto, telefono } });
  res.status(201).json(proveedor);
});

abastecimientoRouter.post('/proveedores/:id/toggle', async (req, res) => {
  const before = await prisma.proveedor.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Proveedor no encontrado' });
  const proveedor = await prisma.proveedor.update({ where: { id: req.params.id }, data: { activo: !before.activo } });
  res.json(proveedor);
});

abastecimientoRouter.get('/ordenes', async (req, res) => {
  const ordenes = await prisma.ordenCompra.findMany({
    include: { items: true, bitacora: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(ordenes);
});

abastecimientoRouter.post('/ordenes', async (req, res) => {
  const { proveedor, fecha, items } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'La orden debe tener al menos un ítem' });

  const folio = await nextFolio();
  const orden = await prisma.ordenCompra.create({
    data: {
      folio,
      proveedor,
      fecha: new Date(fecha),
      items: { create: items.map((it) => ({ descripcion: it.descripcion, cantidad: Number(it.cantidad), precioUnitario: Number(it.precioUnitario) })) },
      bitacora: { create: [{ fecha: new Date(fecha), evento: 'Orden solicitada', detalle: `Solicitada a ${proveedor}.` }] },
    },
    include: { items: true, bitacora: true },
  });
  res.status(201).json(orden);
});

abastecimientoRouter.post('/ordenes/:id/estado', async (req, res) => {
  const { estado, motivo } = req.body;
  const before = await prisma.ordenCompra.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Orden no encontrada' });
  if (!NEXT_ESTADO[before.estado]?.includes(estado)) {
    return res.status(400).json({ error: `Transición de estado inválida: ${before.estado} → ${estado}` });
  }

  const orden = await prisma.ordenCompra.update({
    where: { id: req.params.id },
    data: { estado, bitacora: { create: [{ fecha: new Date(), evento: `Cambio de estado → ${estado}`, detalle: motivo || '—' }] } },
    include: { items: true, bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(orden);
});
