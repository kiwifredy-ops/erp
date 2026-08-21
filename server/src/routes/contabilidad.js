import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const contabilidadRouter = Router();
contabilidadRouter.use(requireAuth);

const IVA_TASA = 0.19;

function diasHasta(fecha) {
  const ms = new Date(fecha).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

function saldoPendiente(f) {
  const notas = (f.notasCredito ?? []).reduce((s, n) => s + n.monto, 0);
  return Math.max(0, f.montoTotal - f.montoPagado - notas);
}

// --- Cuentas bancarias -------------------------------------------------------

contabilidadRouter.get('/cuentas', async (req, res) => {
  const cuentas = await prisma.cuentaBancaria.findMany({
    include: { movimientos: { orderBy: { fecha: 'desc' } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(
    cuentas.map((c) => ({
      ...c,
      saldoActual: c.saldoInicial + c.movimientos.reduce((s, m) => s + (m.tipo === 'Ingreso' ? m.monto : -m.monto), 0),
    }))
  );
});

contabilidadRouter.post('/cuentas', async (req, res) => {
  const { nombre, banco, numeroCuenta, tipo, saldoInicial } = req.body;
  const cuenta = await prisma.cuentaBancaria.create({
    data: { nombre, banco, numeroCuenta, tipo, saldoInicial: Number(saldoInicial) || 0 },
    include: { movimientos: true },
  });
  res.status(201).json({ ...cuenta, saldoActual: cuenta.saldoInicial });
});

contabilidadRouter.post('/cuentas/:id/movimiento', async (req, res) => {
  const { fecha, tipo, categoria, descripcion, monto } = req.body;
  const cuenta = await prisma.cuentaBancaria.findUnique({ where: { id: req.params.id } });
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });

  await prisma.movimientoBancario.create({
    data: { cuentaId: req.params.id, fecha: new Date(fecha), tipo, categoria, descripcion, monto: Number(monto) },
  });
  const actualizada = await prisma.cuentaBancaria.findUnique({ where: { id: req.params.id }, include: { movimientos: { orderBy: { fecha: 'desc' } } } });
  res.status(201).json({ ...actualizada, saldoActual: actualizada.saldoInicial + actualizada.movimientos.reduce((s, m) => s + (m.tipo === 'Ingreso' ? m.monto : -m.monto), 0) });
});

// --- Facturas de venta -------------------------------------------------------

async function nextFolio(model, prefix) {
  const count = await model.count();
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

contabilidadRouter.get('/facturas-venta', async (req, res) => {
  const facturas = await prisma.facturaVenta.findMany({
    include: { pagos: { orderBy: { fecha: 'asc' } }, notasCredito: { orderBy: { fecha: 'asc' } }, bitacora: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(facturas.map((f) => ({ ...f, saldoPendiente: saldoPendiente(f), diasParaVencer: diasHasta(f.fechaVencimiento) })));
});

contabilidadRouter.post('/facturas-venta', async (req, res) => {
  const { cliente, fechaEmision, fechaVencimiento, montoNeto } = req.body;
  const neto = Number(montoNeto);
  const iva = Math.round(neto * IVA_TASA);
  const folio = await nextFolio(prisma.facturaVenta, 'FV');

  const factura = await prisma.facturaVenta.create({
    data: {
      folio,
      cliente,
      fechaEmision: new Date(fechaEmision),
      fechaVencimiento: new Date(fechaVencimiento),
      montoNeto: neto,
      iva,
      montoTotal: neto + iva,
      bitacora: { create: [{ fecha: new Date(fechaEmision), evento: 'Factura emitida', detalle: `Emitida a ${cliente}.` }] },
    },
    include: { pagos: true, notasCredito: true, bitacora: true },
  });
  res.status(201).json({ ...factura, saldoPendiente: saldoPendiente(factura), diasParaVencer: diasHasta(factura.fechaVencimiento) });
});

contabilidadRouter.post('/facturas-venta/:id/pago', async (req, res) => {
  const { fecha, monto, medioPago, cuentaId } = req.body;
  const factura = await prisma.facturaVenta.findUnique({ where: { id: req.params.id }, include: { notasCredito: true } });
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
  if (factura.estado === 'Anulada') return res.status(400).json({ error: 'La factura está anulada' });

  const montoPago = Number(monto);
  const nuevoPagado = factura.montoPagado + montoPago;
  const pendiente = Math.max(0, factura.montoTotal - nuevoPagado - factura.notasCredito.reduce((s, n) => s + n.monto, 0));

  await prisma.pagoCliente.create({ data: { facturaId: req.params.id, fecha: new Date(fecha), monto: montoPago, medioPago, cuentaId: cuentaId || null } });
  if (cuentaId) {
    await prisma.movimientoBancario.create({
      data: { cuentaId, fecha: new Date(fecha), tipo: 'Ingreso', categoria: 'Pago de cliente', descripcion: `${factura.folio} — ${factura.cliente}`, monto: montoPago },
    });
  }

  const factura2 = await prisma.facturaVenta.update({
    where: { id: req.params.id },
    data: {
      montoPagado: nuevoPagado,
      estado: pendiente <= 0 ? 'Pagada' : 'Pendiente',
      bitacora: { create: [{ fecha: new Date(fecha), evento: 'Pago recibido', detalle: `${medioPago}: ${montoPago}` }] },
    },
    include: { pagos: { orderBy: { fecha: 'asc' } }, notasCredito: { orderBy: { fecha: 'asc' } }, bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json({ ...factura2, saldoPendiente: saldoPendiente(factura2), diasParaVencer: diasHasta(factura2.fechaVencimiento) });
});

contabilidadRouter.post('/facturas-venta/:id/notas-credito', async (req, res) => {
  const { fecha, motivo, monto } = req.body;
  const factura = await prisma.facturaVenta.findUnique({ where: { id: req.params.id } });
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

  const folio = await nextFolio(prisma.notaCreditoVenta, 'NCV');
  await prisma.notaCreditoVenta.create({ data: { folio, facturaId: req.params.id, fecha: new Date(fecha), motivo, monto: Number(monto) } });
  const factura2 = await prisma.facturaVenta.update({
    where: { id: req.params.id },
    data: { bitacora: { create: [{ fecha: new Date(fecha), evento: 'Nota de crédito emitida', detalle: `${folio}: ${motivo} (${monto})` }] } },
    include: { pagos: { orderBy: { fecha: 'asc' } }, notasCredito: { orderBy: { fecha: 'asc' } }, bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.status(201).json({ ...factura2, saldoPendiente: saldoPendiente(factura2), diasParaVencer: diasHasta(factura2.fechaVencimiento) });
});

contabilidadRouter.post('/facturas-venta/:id/anular', async (req, res) => {
  const factura = await prisma.facturaVenta.update({
    where: { id: req.params.id },
    data: { estado: 'Anulada', bitacora: { create: [{ fecha: new Date(), evento: 'Factura anulada', detalle: req.body.motivo || '—' }] } },
    include: { pagos: { orderBy: { fecha: 'asc' } }, notasCredito: { orderBy: { fecha: 'asc' } }, bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json({ ...factura, saldoPendiente: saldoPendiente(factura), diasParaVencer: diasHasta(factura.fechaVencimiento) });
});

// --- Facturas de compra ------------------------------------------------------

contabilidadRouter.get('/facturas-compra', async (req, res) => {
  const facturas = await prisma.facturaCompra.findMany({
    include: { pagos: { orderBy: { fecha: 'asc' } }, notasCredito: { orderBy: { fecha: 'asc' } }, bitacora: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(facturas.map((f) => ({ ...f, saldoPendiente: saldoPendiente(f), diasParaVencer: diasHasta(f.fechaVencimiento) })));
});

contabilidadRouter.post('/facturas-compra', async (req, res) => {
  const { proveedor, fechaEmision, fechaVencimiento, montoNeto } = req.body;
  const neto = Number(montoNeto);
  const iva = Math.round(neto * IVA_TASA);
  const folio = await nextFolio(prisma.facturaCompra, 'FC');

  const factura = await prisma.facturaCompra.create({
    data: {
      folio,
      proveedor,
      fechaEmision: new Date(fechaEmision),
      fechaVencimiento: new Date(fechaVencimiento),
      montoNeto: neto,
      iva,
      montoTotal: neto + iva,
      bitacora: { create: [{ fecha: new Date(fechaEmision), evento: 'Factura recibida', detalle: `Recibida de ${proveedor}.` }] },
    },
    include: { pagos: true, notasCredito: true, bitacora: true },
  });
  res.status(201).json({ ...factura, saldoPendiente: saldoPendiente(factura), diasParaVencer: diasHasta(factura.fechaVencimiento) });
});

contabilidadRouter.post('/facturas-compra/:id/pago', async (req, res) => {
  const { fecha, monto, medioPago, cuentaId } = req.body;
  const factura = await prisma.facturaCompra.findUnique({ where: { id: req.params.id }, include: { notasCredito: true } });
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
  if (factura.estado === 'Anulada') return res.status(400).json({ error: 'La factura está anulada' });

  const montoPago = Number(monto);
  const nuevoPagado = factura.montoPagado + montoPago;
  const pendiente = Math.max(0, factura.montoTotal - nuevoPagado - factura.notasCredito.reduce((s, n) => s + n.monto, 0));

  await prisma.pagoProveedor.create({ data: { facturaId: req.params.id, fecha: new Date(fecha), monto: montoPago, medioPago, cuentaId: cuentaId || null } });
  if (cuentaId) {
    await prisma.movimientoBancario.create({
      data: { cuentaId, fecha: new Date(fecha), tipo: 'Egreso', categoria: 'Pago a proveedor', descripcion: `${factura.folio} — ${factura.proveedor}`, monto: montoPago },
    });
  }

  const factura2 = await prisma.facturaCompra.update({
    where: { id: req.params.id },
    data: {
      montoPagado: nuevoPagado,
      estado: pendiente <= 0 ? 'Pagada' : 'Pendiente',
      bitacora: { create: [{ fecha: new Date(fecha), evento: 'Pago realizado', detalle: `${medioPago}: ${montoPago}` }] },
    },
    include: { pagos: { orderBy: { fecha: 'asc' } }, notasCredito: { orderBy: { fecha: 'asc' } }, bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json({ ...factura2, saldoPendiente: saldoPendiente(factura2), diasParaVencer: diasHasta(factura2.fechaVencimiento) });
});

contabilidadRouter.post('/facturas-compra/:id/notas-credito', async (req, res) => {
  const { fecha, motivo, monto } = req.body;
  const factura = await prisma.facturaCompra.findUnique({ where: { id: req.params.id } });
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

  const folio = await nextFolio(prisma.notaCreditoCompra, 'NCC');
  await prisma.notaCreditoCompra.create({ data: { folio, facturaId: req.params.id, fecha: new Date(fecha), motivo, monto: Number(monto) } });
  const factura2 = await prisma.facturaCompra.update({
    where: { id: req.params.id },
    data: { bitacora: { create: [{ fecha: new Date(fecha), evento: 'Nota de crédito recibida', detalle: `${folio}: ${motivo} (${monto})` }] } },
    include: { pagos: { orderBy: { fecha: 'asc' } }, notasCredito: { orderBy: { fecha: 'asc' } }, bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.status(201).json({ ...factura2, saldoPendiente: saldoPendiente(factura2), diasParaVencer: diasHasta(factura2.fechaVencimiento) });
});

contabilidadRouter.post('/facturas-compra/:id/anular', async (req, res) => {
  const factura = await prisma.facturaCompra.update({
    where: { id: req.params.id },
    data: { estado: 'Anulada', bitacora: { create: [{ fecha: new Date(), evento: 'Factura anulada', detalle: req.body.motivo || '—' }] } },
    include: { pagos: { orderBy: { fecha: 'asc' } }, notasCredito: { orderBy: { fecha: 'asc' } }, bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json({ ...factura, saldoPendiente: saldoPendiente(factura), diasParaVencer: diasHasta(factura.fechaVencimiento) });
});

// --- Resumen y alertas ---------------------------------------------------------

contabilidadRouter.get('/resumen', async (req, res) => {
  const [cuentas, facturasVenta, facturasCompra] = await Promise.all([
    prisma.cuentaBancaria.findMany({ where: { activa: true }, include: { movimientos: true } }),
    prisma.facturaVenta.findMany({ include: { notasCredito: true } }),
    prisma.facturaCompra.findMany({ include: { notasCredito: true } }),
  ]);

  const saldoTotalBancos = cuentas.reduce((sum, c) => sum + c.saldoInicial + c.movimientos.reduce((s, m) => s + (m.tipo === 'Ingreso' ? m.monto : -m.monto), 0), 0);

  const ventasPendientes = facturasVenta.filter((f) => f.estado === 'Pendiente');
  const comprasPendientes = facturasCompra.filter((f) => f.estado === 'Pendiente');
  const cuentasPorCobrar = ventasPendientes.reduce((s, f) => s + saldoPendiente(f), 0);
  const cuentasPorPagar = comprasPendientes.reduce((s, f) => s + saldoPendiente(f), 0);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const movimientosMes = cuentas.flatMap((c) => c.movimientos).filter((m) => new Date(m.fecha) >= inicioMes);
  const ingresosMes = movimientosMes.filter((m) => m.tipo === 'Ingreso').reduce((s, m) => s + m.monto, 0);
  const egresosMes = movimientosMes.filter((m) => m.tipo === 'Egreso').reduce((s, m) => s + m.monto, 0);

  res.json({
    saldoTotalBancos,
    cuentasPorCobrar,
    cuentasPorPagar,
    facturasVentaPendientes: ventasPendientes.length,
    facturasCompraPendientes: comprasPendientes.length,
    ingresosMes,
    egresosMes,
  });
});

contabilidadRouter.get('/alertas', async (req, res) => {
  const [facturasVenta, facturasCompra] = await Promise.all([
    prisma.facturaVenta.findMany({ where: { estado: 'Pendiente' }, include: { notasCredito: true } }),
    prisma.facturaCompra.findMany({ where: { estado: 'Pendiente' }, include: { notasCredito: true } }),
  ]);

  const ventasVencidas = facturasVenta
    .map((f) => ({ id: f.id, folio: f.folio, cliente: f.cliente, monto: saldoPendiente(f), diasRestantes: diasHasta(f.fechaVencimiento) }))
    .filter((f) => f.diasRestantes <= 5 && f.monto > 0);
  const comprasVencidas = facturasCompra
    .map((f) => ({ id: f.id, folio: f.folio, proveedor: f.proveedor, monto: saldoPendiente(f), diasRestantes: diasHasta(f.fechaVencimiento) }))
    .filter((f) => f.diasRestantes <= 5 && f.monto > 0);

  res.json({ ventasVencidas, comprasVencidas });
});
