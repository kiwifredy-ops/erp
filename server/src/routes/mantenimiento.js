import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requirePermiso, requireAlguno, tienePermiso } from '../middleware/permisos.js';
import { resolveTenant } from '../middleware/tenant.js';

export const mantenimientoRouter = Router();
mantenimientoRouter.use(requireAuth, resolveTenant);

const V = requirePermiso('mantenimiento', 'ver');
const C = requirePermiso('mantenimiento', 'crear');
const E = requirePermiso('mantenimiento', 'editar');
const VoE = requireAlguno('mantenimiento', ['ver', 'editar']);

// Sin "ver" (visibilidad completa), solo se puede actuar sobre visitas
// asignadas al propio usuario — mismo patrón que Tickets.
async function esPropioOGestion(req, res, visita) {
  if (await tienePermiso(req, 'mantenimiento', 'ver')) return true;
  if (visita.tecnico === req.user.nombre) return true;
  res.status(403).json({ error: 'Solo puedes actuar sobre visitas asignadas a ti.' });
  return false;
}

const NEXT_ESTADO_VISITA = {
  Programada: ['En curso', 'Cancelada'],
  'En curso': ['Realizada', 'Cancelada'],
  Realizada: [],
  Cancelada: [],
};

function diasHasta(fecha) {
  if (!fecha) return null;
  const ms = new Date(fecha).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

async function nextFolioContrato(prismaClient) {
  const count = await prismaClient.contratoMantencion.count();
  return `CM${String(count + 1).padStart(4, '0')}`;
}

async function nextFolioVisita(prismaClient) {
  const count = await prismaClient.visitaMantencion.count();
  return `VM${String(count + 1).padStart(4, '0')}`;
}

const CONTRATO_INCLUDE = {
  bitacora: { orderBy: { fecha: 'asc' } },
  visitas: { orderBy: { fechaProgramada: 'desc' }, select: { id: true, folio: true, tipoMantenimiento: true, tecnico: true, fechaProgramada: true, estado: true } },
};

const VISITA_INCLUDE = { bitacora: { orderBy: { fecha: 'asc' } } };

// --- Contratos de mantención ------------------------------------------

mantenimientoRouter.get('/contratos', V, async (req, res) => {
  const contratos = await req.prisma.contratoMantencion.findMany({ include: CONTRATO_INCLUDE, orderBy: { createdAt: 'desc' } });
  res.json(contratos);
});

// Contratos próximos a vencer (caducidad) o ya vencidos, sin contar los
// cancelados — mismo patrón que las alertas de documentación de Flota.
mantenimientoRouter.get('/contratos/alertas', V, async (req, res) => {
  const contratos = await req.prisma.contratoMantencion.findMany({ where: { estado: { not: 'Cancelado' } } });
  const alertas = [];
  for (const c of contratos) {
    const dias = diasHasta(c.fechaTermino);
    if (dias !== null && dias <= 30) {
      alertas.push({ id: c.id, folio: c.folio, cliente: c.cliente, fechaTermino: c.fechaTermino, diasRestantes: dias });
    }
  }
  res.json({ contratosPorVencer: alertas });
});

mantenimientoRouter.get('/contratos/:id', V, async (req, res) => {
  const contrato = await req.prisma.contratoMantencion.findUnique({ where: { id: req.params.id }, include: CONTRATO_INCLUDE });
  if (!contrato) return res.status(404).json({ error: 'Contrato no encontrado' });
  res.json(contrato);
});

mantenimientoRouter.post('/contratos', C, async (req, res) => {
  const { clienteId, cliente, tipoMantenimiento, periodicidad, fechaInicio, fechaTermino, valorMensual, alcance } = req.body;
  if (!cliente || !tipoMantenimiento || !periodicidad || !fechaInicio || !fechaTermino) {
    return res.status(400).json({ error: 'Faltan datos del contrato' });
  }
  const folio = await nextFolioContrato(req.prisma);
  const contrato = await req.prisma.contratoMantencion.create({
    data: {
      folio,
      clienteId: clienteId || null,
      cliente,
      tipoMantenimiento,
      periodicidad,
      fechaInicio: new Date(fechaInicio),
      fechaTermino: new Date(fechaTermino),
      valorMensual: valorMensual ? Number(valorMensual) : null,
      alcance: alcance || null,
      bitacora: { create: [{ fecha: new Date(), evento: 'Contrato creado', detalle: `Vigencia ${fechaInicio} a ${fechaTermino}.` }] },
    },
    include: CONTRATO_INCLUDE,
  });
  res.status(201).json(contrato);
});

const CAMPOS_EDITABLES_CONTRATO = ['tipoMantenimiento', 'periodicidad', 'valorMensual', 'alcance'];

mantenimientoRouter.patch('/contratos/:id', E, async (req, res) => {
  const data = {};
  for (const campo of CAMPOS_EDITABLES_CONTRATO) {
    if (req.body[campo] !== undefined) data[campo] = campo === 'valorMensual' ? (req.body[campo] ? Number(req.body[campo]) : null) : req.body[campo] || null;
  }
  if (req.body.fechaTermino !== undefined) data.fechaTermino = new Date(req.body.fechaTermino);
  const contrato = await req.prisma.contratoMantencion.update({
    where: { id: req.params.id },
    data: { ...data, bitacora: { create: [{ fecha: new Date(), evento: 'Contrato actualizado' }] } },
    include: CONTRATO_INCLUDE,
  });
  res.json(contrato);
});

mantenimientoRouter.post('/contratos/:id/cancelar', E, async (req, res) => {
  const { motivo } = req.body;
  const contrato = await req.prisma.contratoMantencion.update({
    where: { id: req.params.id },
    data: { estado: 'Cancelado', bitacora: { create: [{ fecha: new Date(), evento: 'Contrato cancelado', detalle: motivo || '—' }] } },
    include: CONTRATO_INCLUDE,
  });
  res.json(contrato);
});

// --- Agenda de visitas de mantención ------------------------------------

mantenimientoRouter.get('/visitas', V, async (req, res) => {
  const visitas = await req.prisma.visitaMantencion.findMany({ include: VISITA_INCLUDE, orderBy: { fechaProgramada: 'desc' } });
  res.json(visitas);
});

// Autoservicio: solo las visitas asignadas al técnico logueado.
mantenimientoRouter.get('/visitas/mias', VoE, async (req, res) => {
  const visitas = await req.prisma.visitaMantencion.findMany({ where: { tecnico: req.user.nombre }, include: VISITA_INCLUDE, orderBy: { fechaProgramada: 'desc' } });
  res.json(visitas);
});

mantenimientoRouter.post('/visitas', C, async (req, res) => {
  const { contratoId, clienteId, cliente, direccion, tipoMantenimiento, fechaProgramada, tecnico } = req.body;
  if (!cliente || !direccion || !tipoMantenimiento || !fechaProgramada) {
    return res.status(400).json({ error: 'Faltan datos de la visita' });
  }
  const folio = await nextFolioVisita(req.prisma);
  const visita = await req.prisma.visitaMantencion.create({
    data: {
      folio,
      contratoId: contratoId || null,
      clienteId: clienteId || null,
      cliente,
      direccion,
      tipoMantenimiento,
      fechaProgramada: new Date(fechaProgramada),
      tecnico: tecnico || null,
      bitacora: {
        create: [
          { fecha: new Date(), evento: 'Visita programada', detalle: contratoId ? 'Generada desde un contrato de mantención.' : 'Servicio puntual, sin contrato.' },
          ...(tecnico ? [{ fecha: new Date(), evento: 'Técnico asignado', detalle: `Asignado a ${tecnico}.` }] : []),
        ],
      },
    },
    include: VISITA_INCLUDE,
  });
  res.status(201).json(visita);
});

// Asignar, reprogramar y cancelar son acciones de gestión de la agenda, no
// de autoservicio — reservadas a quien tiene "ver".
mantenimientoRouter.post('/visitas/:id/asignar', V, async (req, res) => {
  const { tecnico } = req.body;
  const visita = await req.prisma.visitaMantencion.update({
    where: { id: req.params.id },
    data: { tecnico, bitacora: { create: [{ fecha: new Date(), evento: 'Técnico asignado', detalle: `Asignado a ${tecnico}.` }] } },
    include: VISITA_INCLUDE,
  });
  res.json(visita);
});

mantenimientoRouter.post('/visitas/:id/reprogramar', V, async (req, res) => {
  const { fechaProgramada, motivo } = req.body;
  if (!fechaProgramada) return res.status(400).json({ error: 'Falta la nueva fecha' });
  const visita = await req.prisma.visitaMantencion.update({
    where: { id: req.params.id },
    data: {
      fechaProgramada: new Date(fechaProgramada),
      estado: 'Programada',
      bitacora: { create: [{ fecha: new Date(), evento: 'Visita reprogramada', detalle: motivo || `Nueva fecha: ${fechaProgramada}.` }] },
    },
    include: VISITA_INCLUDE,
  });
  res.json(visita);
});

mantenimientoRouter.post('/visitas/:id/cancelar', V, async (req, res) => {
  const { motivo } = req.body;
  const before = await req.prisma.visitaMantencion.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Visita no encontrada' });
  if (!NEXT_ESTADO_VISITA[before.estado]?.includes('Cancelada')) {
    return res.status(400).json({ error: `No se puede cancelar una visita en estado ${before.estado}` });
  }
  const visita = await req.prisma.visitaMantencion.update({
    where: { id: req.params.id },
    data: { estado: 'Cancelada', bitacora: { create: [{ fecha: new Date(), evento: 'Visita cancelada', detalle: motivo || '—' }] } },
    include: VISITA_INCLUDE,
  });
  res.json(visita);
});

mantenimientoRouter.post('/visitas/:id/iniciar', E, async (req, res) => {
  const before = await req.prisma.visitaMantencion.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Visita no encontrada' });
  if (!(await esPropioOGestion(req, res, before))) return;
  if (before.estado !== 'Programada') return res.status(400).json({ error: `No se puede iniciar una visita en estado ${before.estado}` });

  const visita = await req.prisma.visitaMantencion.update({
    where: { id: req.params.id },
    data: { estado: 'En curso', bitacora: { create: [{ fecha: new Date(), evento: 'Servicio iniciado' }] } },
    include: VISITA_INCLUDE,
  });
  res.json(visita);
});

mantenimientoRouter.post('/visitas/:id/completar', E, async (req, res) => {
  const { observaciones } = req.body;
  const before = await req.prisma.visitaMantencion.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Visita no encontrada' });
  if (!(await esPropioOGestion(req, res, before))) return;
  if (before.estado !== 'En curso') return res.status(400).json({ error: `No se puede completar una visita en estado ${before.estado}` });

  const visita = await req.prisma.visitaMantencion.update({
    where: { id: req.params.id },
    data: {
      estado: 'Realizada',
      fechaRealizada: new Date(),
      observaciones,
      bitacora: { create: [{ fecha: new Date(), evento: 'Servicio completado', detalle: observaciones || '—' }] },
    },
    include: VISITA_INCLUDE,
  });
  res.json(visita);
});
