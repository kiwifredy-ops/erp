import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const ticketsRouter = Router();
ticketsRouter.use(requireAuth);

const NEXT_ESTADO = {
  Abierto: ['Asignado', 'Cancelado'],
  Asignado: ['En curso', 'Cancelado'],
  'En curso': ['Completado', 'Cancelado'],
  Completado: ['Cerrado'],
  Cerrado: [],
  Cancelado: [],
};

const INCLUDE = {
  bitacora: { orderBy: { fecha: 'asc' } },
  archivos: { select: { id: true, tipo: true, nombreArchivo: true, mimeType: true, fechaSubida: true } },
  encuesta: true,
  clienteRef: { select: { id: true, nombre: true, telefono: true, email: true } },
};

async function nextFolio() {
  const count = await prisma.ticket.count();
  return `TK${String(count + 1).padStart(4, '0')}`;
}

ticketsRouter.get('/', async (req, res) => {
  const tickets = await prisma.ticket.findMany({ include: INCLUDE, orderBy: { createdAt: 'desc' } });
  res.json(tickets);
});

ticketsRouter.post('/', async (req, res) => {
  const { cliente, clienteId, direccion, descripcion, prioridad } = req.body;
  const folio = await nextFolio();
  const ticket = await prisma.ticket.create({
    data: {
      folio,
      cliente,
      clienteId: clienteId || null,
      direccion,
      descripcion,
      prioridad: prioridad || 'Media',
      bitacora: { create: [{ fecha: new Date(), evento: 'Ticket creado', detalle: `Solicitado por ${cliente}.` }] },
    },
    include: INCLUDE,
  });
  res.status(201).json(ticket);
});

ticketsRouter.post('/:id/asignar', async (req, res) => {
  const { tecnico } = req.body;
  const before = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (!['Abierto', 'Asignado'].includes(before.estado)) {
    return res.status(400).json({ error: `No se puede asignar un ticket en estado ${before.estado}` });
  }

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: {
      tecnico,
      estado: 'Asignado',
      bitacora: { create: [{ fecha: new Date(), evento: 'Ticket asignado', detalle: `Asignado a ${tecnico}.` }] },
    },
    include: INCLUDE,
  });
  res.json(ticket);
});

ticketsRouter.post('/:id/iniciar', async (req, res) => {
  const { lat, lng } = req.body;
  const before = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (before.estado !== 'Asignado') return res.status(400).json({ error: `No se puede iniciar un ticket en estado ${before.estado}` });

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: {
      estado: 'En curso',
      fechaInicio: new Date(),
      latInicio: lat != null ? Number(lat) : null,
      lngInicio: lng != null ? Number(lng) : null,
      bitacora: {
        create: [{
          fecha: new Date(),
          evento: 'Servicio iniciado',
          detalle: lat != null ? `Ubicación registrada: ${lat}, ${lng}` : 'Ubicación no disponible.',
        }],
      },
    },
    include: INCLUDE,
  });
  res.json(ticket);
});

ticketsRouter.post('/:id/finalizar', async (req, res) => {
  const { lat, lng, observaciones } = req.body;
  const before = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (before.estado !== 'En curso') return res.status(400).json({ error: `No se puede finalizar un ticket en estado ${before.estado}` });

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: {
      estado: 'Completado',
      fechaFin: new Date(),
      latFin: lat != null ? Number(lat) : null,
      lngFin: lng != null ? Number(lng) : null,
      observaciones,
      bitacora: {
        create: [{
          fecha: new Date(),
          evento: 'Servicio finalizado',
          detalle: lat != null ? `Ubicación registrada: ${lat}, ${lng}` : 'Ubicación no disponible.',
        }],
      },
    },
    include: INCLUDE,
  });
  res.json(ticket);
});

ticketsRouter.post('/:id/firma', async (req, res) => {
  const { firma } = req.body;
  if (!firma) return res.status(400).json({ error: 'Falta la firma' });
  const before = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (before.estado !== 'Completado') return res.status(400).json({ error: 'El ticket debe estar completado para firmar' });

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: { firmaCliente: firma, bitacora: { create: [{ fecha: new Date(), evento: 'Firma del cliente registrada' }] } },
    include: INCLUDE,
  });
  res.json(ticket);
});

ticketsRouter.post('/:id/encuesta', async (req, res) => {
  const { calificacion, comentario } = req.body;
  const before = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Ticket no encontrado' });

  await prisma.encuestaSatisfaccion.upsert({
    where: { ticketId: req.params.id },
    update: { calificacion: Number(calificacion), comentario },
    create: { ticketId: req.params.id, calificacion: Number(calificacion), comentario },
  });
  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: { bitacora: { create: [{ fecha: new Date(), evento: 'Encuesta de satisfacción respondida', detalle: `Calificación: ${calificacion}/5` }] } },
    include: INCLUDE,
  });
  res.status(201).json(ticket);
});

ticketsRouter.post('/:id/cerrar', async (req, res) => {
  const before = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (before.estado !== 'Completado') return res.status(400).json({ error: 'Solo se pueden cerrar tickets completados' });

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: { estado: 'Cerrado', bitacora: { create: [{ fecha: new Date(), evento: 'Ticket cerrado' }] } },
    include: INCLUDE,
  });
  res.json(ticket);
});

ticketsRouter.post('/:id/cancelar', async (req, res) => {
  const { motivo } = req.body;
  const before = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (!NEXT_ESTADO[before.estado]?.includes('Cancelado')) {
    return res.status(400).json({ error: `No se puede cancelar un ticket en estado ${before.estado}` });
  }

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: { estado: 'Cancelado', bitacora: { create: [{ fecha: new Date(), evento: 'Ticket cancelado', detalle: motivo || '—' }] } },
    include: INCLUDE,
  });
  res.json(ticket);
});

// --- Archivos (fotos / video) ------------------------------------------------

ticketsRouter.post('/:id/archivos', async (req, res) => {
  const { tipo, nombreArchivo, mimeType, contenido } = req.body;
  if (!tipo || !nombreArchivo || !mimeType || !contenido) {
    return res.status(400).json({ error: 'Faltan datos del archivo' });
  }
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

  await prisma.ticketArchivo.create({ data: { ticketId: req.params.id, tipo, nombreArchivo, mimeType, contenido } });
  await prisma.ticketBitacora.create({ data: { ticketId: req.params.id, fecha: new Date(), evento: `${tipo} adjuntado`, detalle: nombreArchivo } });
  const actualizado = await prisma.ticket.findUnique({ where: { id: req.params.id }, include: INCLUDE });
  res.status(201).json(actualizado);
});

ticketsRouter.get('/:id/archivos/:archivoId', async (req, res) => {
  const archivo = await prisma.ticketArchivo.findFirst({ where: { id: req.params.archivoId, ticketId: req.params.id } });
  if (!archivo) return res.status(404).json({ error: 'Archivo no encontrado' });
  res.json(archivo);
});

ticketsRouter.delete('/:id/archivos/:archivoId', async (req, res) => {
  await prisma.ticketArchivo.deleteMany({ where: { id: req.params.archivoId, ticketId: req.params.id } });
  const actualizado = await prisma.ticket.findUnique({ where: { id: req.params.id }, include: INCLUDE });
  res.json(actualizado);
});
