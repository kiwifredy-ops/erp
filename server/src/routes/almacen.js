import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermiso } from '../middleware/permisos.js';

export const almacenRouter = Router();
almacenRouter.use(requireAuth);

const V = requirePermiso('almacen', 'ver');
const C = requirePermiso('almacen', 'crear');
const E = requirePermiso('almacen', 'editar');

almacenRouter.get('/items', V, async (req, res) => {
  const items = await prisma.item.findMany({
    include: { movimientos: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
});

almacenRouter.get('/items/alertas', V, async (req, res) => {
  const items = await prisma.item.findMany();
  const bajoMinimo = items
    .filter((it) => it.stock < it.stockMinimo)
    .map((it) => ({ id: it.id, nombre: it.nombre, stock: it.stock, stockMinimo: it.stockMinimo, unidad: it.unidad }));
  res.json({ bajoMinimo });
});

almacenRouter.post('/items', C, async (req, res) => {
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

almacenRouter.post('/items/:id/movimientos', E, async (req, res) => {
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

// Genera una orden de compra en Abastecimiento a partir de un material bajo mínimo.
almacenRouter.post('/items/:id/solicitar-reposicion', E, async (req, res) => {
  const { proveedor, cantidad, precioUnitario } = req.body;
  const item = await prisma.item.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Material no encontrado' });
  if (!proveedor || !cantidad || !precioUnitario) return res.status(400).json({ error: 'Proveedor, cantidad y precio unitario son requeridos' });

  const count = await prisma.ordenCompra.count();
  const folio = `OC${String(count + 1).padStart(4, '0')}`;
  const orden = await prisma.ordenCompra.create({
    data: {
      folio,
      proveedor,
      fecha: new Date(),
      items: { create: [{ descripcion: item.nombre, cantidad: Number(cantidad), precioUnitario: Number(precioUnitario) }] },
      bitacora: { create: [{ fecha: new Date(), evento: 'Orden solicitada', detalle: `Solicitud de reposición generada desde Almacén para "${item.nombre}".` }] },
    },
    include: { items: true, bitacora: true },
  });
  res.status(201).json(orden);
});

const GARANTIA_INCLUDE = { bitacora: { orderBy: { fecha: 'asc' } } };

almacenRouter.get('/equipos', V, async (req, res) => {
  const equipos = await prisma.equipo.findMany({
    include: GARANTIA_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json(equipos);
});

almacenRouter.post('/equipos', C, async (req, res) => {
  const { equipo, tipo, numeroSerie, fechaCompra, mesesGarantia } = req.body;
  const nuevo = await prisma.equipo.create({
    data: {
      equipo,
      tipo,
      numeroSerie: numeroSerie || null,
      fechaCompra: fechaCompra ? new Date(fechaCompra) : null,
      mesesGarantia: mesesGarantia ? Number(mesesGarantia) : null,
      bitacora: { create: [{ fecha: new Date(), evento: 'Registro', detalle: 'Equipo dado de alta en bodega.' }] },
    },
    include: GARANTIA_INCLUDE,
  });
  res.status(201).json(nuevo);
});

almacenRouter.post('/equipos/:id/asignar', E, async (req, res) => {
  const { tecnico, clienteInstalacion } = req.body;
  const equipo = await prisma.equipo.update({
    where: { id: req.params.id },
    data: {
      estado: 'Asignado',
      tecnico,
      clienteInstalacion: clienteInstalacion || null,
      fechaAsignacion: new Date(),
      bitacora: {
        create: [{
          fecha: new Date(),
          evento: 'Asignación',
          detalle: `Entregado a ${tecnico}.${clienteInstalacion ? ` Instalación: ${clienteInstalacion}.` : ''}`,
        }],
      },
    },
    include: GARANTIA_INCLUDE,
  });
  res.json(equipo);
});

almacenRouter.post('/equipos/:id/devolver', E, async (req, res) => {
  const before = await prisma.equipo.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Equipo no encontrado' });

  const equipo = await prisma.equipo.update({
    where: { id: req.params.id },
    data: {
      estado: 'En bodega',
      tecnico: null,
      bitacora: { create: [{ fecha: new Date(), evento: 'Devolución', detalle: `Devuelto por ${before.tecnico}.` }] },
    },
    include: GARANTIA_INCLUDE,
  });
  res.json(equipo);
});

almacenRouter.patch('/equipos/:id', E, async (req, res) => {
  const { numeroSerie, fechaCompra, mesesGarantia, clienteInstalacion } = req.body;
  const data = {};
  if (numeroSerie !== undefined) data.numeroSerie = numeroSerie;
  if (fechaCompra !== undefined) data.fechaCompra = fechaCompra ? new Date(fechaCompra) : null;
  if (mesesGarantia !== undefined) data.mesesGarantia = mesesGarantia ? Number(mesesGarantia) : null;
  if (clienteInstalacion !== undefined) data.clienteInstalacion = clienteInstalacion;

  const equipo = await prisma.equipo.update({
    where: { id: req.params.id },
    data: { ...data, bitacora: { create: [{ fecha: new Date(), evento: 'Actualización de ficha', detalle: 'Se actualizaron los datos del equipo.' }] } },
    include: GARANTIA_INCLUDE,
  });
  res.json(equipo);
});
