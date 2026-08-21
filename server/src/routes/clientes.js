import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermiso } from '../middleware/permisos.js';

export const clientesRouter = Router();
clientesRouter.use(requireAuth);

const V = requirePermiso('clientes', 'ver');
const C = requirePermiso('clientes', 'crear');
const E = requirePermiso('clientes', 'editar');

clientesRouter.get('/', V, async (req, res) => {
  const clientes = await prisma.cliente.findMany({
    include: { _count: { select: { tickets: true, facturasVenta: true } } },
    orderBy: { nombre: 'asc' },
  });
  res.json(clientes);
});

clientesRouter.get('/:id', V, async (req, res) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id: req.params.id },
    include: {
      tickets: { orderBy: { createdAt: 'desc' }, select: { id: true, folio: true, descripcion: true, estado: true, createdAt: true } },
      facturasVenta: { orderBy: { createdAt: 'desc' }, select: { id: true, folio: true, montoTotal: true, estado: true, fechaEmision: true } },
    },
  });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(cliente);
});

clientesRouter.post('/', C, async (req, res) => {
  const { tipo, nombre, rut, direccion, comuna, ciudad, telefono, email, contactoNombre, contactoCargo, contactoTelefono, notas } = req.body;
  const cliente = await prisma.cliente.create({
    data: { tipo, nombre, rut: rut || null, direccion, comuna, ciudad, telefono, email, contactoNombre, contactoCargo, contactoTelefono, notas },
    include: { _count: { select: { tickets: true, facturasVenta: true } } },
  });
  res.status(201).json(cliente);
});

const CAMPOS_EDITABLES = ['tipo', 'nombre', 'rut', 'direccion', 'comuna', 'ciudad', 'telefono', 'email', 'contactoNombre', 'contactoCargo', 'contactoTelefono', 'notas'];

clientesRouter.patch('/:id', E, async (req, res) => {
  const data = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (req.body[campo] !== undefined) data[campo] = req.body[campo] || null;
  }
  const cliente = await prisma.cliente.update({
    where: { id: req.params.id },
    data,
    include: { _count: { select: { tickets: true, facturasVenta: true } } },
  });
  res.json(cliente);
});

clientesRouter.post('/:id/toggle', E, async (req, res) => {
  const before = await prisma.cliente.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Cliente no encontrado' });
  const cliente = await prisma.cliente.update({
    where: { id: req.params.id },
    data: { activo: !before.activo },
    include: { _count: { select: { tickets: true, facturasVenta: true } } },
  });
  res.json(cliente);
});
