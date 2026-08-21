import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermiso } from '../middleware/permisos.js';

export const rrhhRouter = Router();
rrhhRouter.use(requireAuth);

const V = requirePermiso('rrhh', 'ver');
const C = requirePermiso('rrhh', 'crear');
const E = requirePermiso('rrhh', 'editar');
const D = requirePermiso('rrhh', 'eliminar');

const NEXT_ESTADO = {
  Activo: ['Vacaciones', 'Licencia médica', 'Baja'],
  Vacaciones: ['Activo', 'Baja'],
  'Licencia médica': ['Activo', 'Baja'],
  Baja: [],
};

const DOC_INCLUDE = {
  bitacora: { orderBy: { fecha: 'asc' } },
  hijos: true,
  documentos: { select: { id: true, tipo: true, nombreArchivo: true, mimeType: true, fechaSubida: true } },
};

function diasHasta(fecha) {
  if (!fecha) return null;
  const ms = new Date(fecha).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

rrhhRouter.get('/empleados', V, async (req, res) => {
  const empleados = await prisma.empleado.findMany({
    include: DOC_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json(empleados);
});

rrhhRouter.get('/empleados/alertas', V, async (req, res) => {
  const empleados = await prisma.empleado.findMany({ where: { estado: { not: 'Baja' } } });
  const contratosPorVencer = empleados
    .filter((e) => e.fechaTerminoContrato)
    .map((e) => ({ ...e, diasRestantes: diasHasta(e.fechaTerminoContrato) }))
    .filter((e) => e.diasRestantes <= 5);
  const cedulasPorVencer = empleados
    .filter((e) => e.rutVencimiento)
    .map((e) => ({ ...e, diasRestantes: diasHasta(e.rutVencimiento) }))
    .filter((e) => e.diasRestantes <= 30);
  res.json({
    contratosPorVencer: contratosPorVencer.map((e) => ({ id: e.id, nombre: e.nombre, fecha: e.fechaTerminoContrato, diasRestantes: e.diasRestantes })),
    cedulasPorVencer: cedulasPorVencer.map((e) => ({ id: e.id, nombre: e.nombre, fecha: e.rutVencimiento, diasRestantes: e.diasRestantes })),
  });
});

rrhhRouter.post('/empleados', C, async (req, res) => {
  const { nombre, documento, cargo, departamento, tipoContrato, fechaIngreso, email, telefono } = req.body;
  const empleado = await prisma.empleado.create({
    data: {
      nombre,
      documento,
      cargo,
      departamento,
      tipoContrato,
      fechaIngreso: new Date(fechaIngreso),
      email,
      telefono,
      bitacora: {
        create: [{ fecha: new Date(fechaIngreso), evento: 'Contratación', detalle: `Ingreso como ${cargo} en ${departamento}.` }],
      },
    },
    include: DOC_INCLUDE,
  });
  res.status(201).json(empleado);
});

rrhhRouter.patch('/empleados/:id', E, async (req, res) => {
  const { cargo, departamento, tipoContrato } = req.body;
  const before = await prisma.empleado.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Empleado no encontrado' });

  const campos = { cargo: 'Cargo', departamento: 'Departamento', tipoContrato: 'Tipo de contrato' };
  const cambios = { cargo, departamento, tipoContrato };
  const bitacoraNueva = Object.entries(cambios)
    .filter(([k, v]) => v !== undefined && before[k] !== v)
    .map(([k, v]) => ({ fecha: new Date(), evento: `Actualización de ${campos[k]}`, detalle: `${campos[k]}: ${before[k]} → ${v}` }));

  const empleado = await prisma.empleado.update({
    where: { id: req.params.id },
    data: { ...cambios, bitacora: { create: bitacoraNueva } },
    include: DOC_INCLUDE,
  });
  res.json(empleado);
});

// Ficha completa: contrato, previsión, datos personales, salud, licencia, cédula.
// Un solo endpoint porque se edita como un formulario único en el drawer del empleado.
const CAMPOS_PERFIL = [
  'fechaTerminoContrato',
  'afp',
  'isapre',
  'isapreAdicional',
  'estadoCivil',
  'direccionCalle',
  'direccionNumero',
  'direccionComuna',
  'direccionCiudad',
  'contactoEmergenciaNombre',
  'contactoEmergenciaTelefono',
  'grupoSanguineo',
  'alergias',
  'tratamientoMedico',
  'licenciaConducir',
  'licenciaClase',
  'rutSerie',
  'rutVencimiento',
];
const CAMPOS_FECHA = new Set(['fechaTerminoContrato', 'rutVencimiento']);

rrhhRouter.patch('/empleados/:id/perfil', E, async (req, res) => {
  const before = await prisma.empleado.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Empleado no encontrado' });

  const data = {};
  for (const campo of CAMPOS_PERFIL) {
    if (req.body[campo] === undefined) continue;
    const valor = req.body[campo];
    data[campo] = CAMPOS_FECHA.has(campo) ? (valor ? new Date(valor) : null) : valor;
  }

  const empleado = await prisma.empleado.update({
    where: { id: req.params.id },
    data: {
      ...data,
      bitacora: { create: [{ fecha: new Date(), evento: 'Actualización de ficha', detalle: 'Se actualizaron datos de la ficha del empleado.' }] },
    },
    include: DOC_INCLUDE,
  });
  res.json(empleado);
});

rrhhRouter.post('/empleados/:id/estado', E, async (req, res) => {
  const { estado, motivo } = req.body;
  const before = await prisma.empleado.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Empleado no encontrado' });
  if (!NEXT_ESTADO[before.estado]?.includes(estado)) {
    return res.status(400).json({ error: `Transición de estado inválida: ${before.estado} → ${estado}` });
  }

  const empleado = await prisma.empleado.update({
    where: { id: req.params.id },
    data: {
      estado,
      bitacora: { create: [{ fecha: new Date(), evento: `Cambio de estado → ${estado}`, detalle: motivo || '—' }] },
    },
    include: DOC_INCLUDE,
  });
  res.json(empleado);
});

// --- Hijos -----------------------------------------------------------------

rrhhRouter.post('/empleados/:id/hijos', E, async (req, res) => {
  const { nombre, fechaNacimiento } = req.body;
  const empleado = await prisma.empleado.findUnique({ where: { id: req.params.id } });
  if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

  await prisma.hijo.create({
    data: { empleadoId: req.params.id, nombre, fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null },
  });
  const actualizado = await prisma.empleado.findUnique({ where: { id: req.params.id }, include: DOC_INCLUDE });
  res.status(201).json(actualizado);
});

rrhhRouter.delete('/empleados/:id/hijos/:hijoId', D, async (req, res) => {
  await prisma.hijo.deleteMany({ where: { id: req.params.hijoId, empleadoId: req.params.id } });
  const actualizado = await prisma.empleado.findUnique({ where: { id: req.params.id }, include: DOC_INCLUDE });
  res.json(actualizado);
});

// --- Documentos --------------------------------------------------------------

rrhhRouter.post('/empleados/:id/documentos', E, async (req, res) => {
  const { tipo, nombreArchivo, mimeType, contenido } = req.body;
  if (!tipo || !nombreArchivo || !mimeType || !contenido) {
    return res.status(400).json({ error: 'Faltan datos del documento' });
  }
  const empleado = await prisma.empleado.findUnique({ where: { id: req.params.id } });
  if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

  await prisma.documento.create({
    data: { empleadoId: req.params.id, tipo, nombreArchivo, mimeType, contenido },
  });
  await prisma.empleadoBitacora.create({
    data: { empleadoId: req.params.id, fecha: new Date(), evento: 'Documento adjuntado', detalle: `${tipo}: ${nombreArchivo}` },
  });
  const actualizado = await prisma.empleado.findUnique({ where: { id: req.params.id }, include: DOC_INCLUDE });
  res.status(201).json(actualizado);
});

rrhhRouter.get('/empleados/:id/documentos/:docId', V, async (req, res) => {
  const doc = await prisma.documento.findFirst({ where: { id: req.params.docId, empleadoId: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
  res.json(doc);
});

rrhhRouter.delete('/empleados/:id/documentos/:docId', D, async (req, res) => {
  await prisma.documento.deleteMany({ where: { id: req.params.docId, empleadoId: req.params.id } });
  const actualizado = await prisma.empleado.findUnique({ where: { id: req.params.id }, include: DOC_INCLUDE });
  res.json(actualizado);
});

rrhhRouter.get('/departamentos-resumen', V, async (req, res) => {
  const empleados = await prisma.empleado.findMany();
  const porDepto = {};
  for (const e of empleados) {
    porDepto[e.departamento] ??= { departamento: e.departamento, total: 0, activos: 0, cargos: new Set() };
    porDepto[e.departamento].total += 1;
    if (e.estado === 'Activo') porDepto[e.departamento].activos += 1;
    porDepto[e.departamento].cargos.add(e.cargo);
  }
  res.json(Object.values(porDepto).map((d) => ({ ...d, cargos: [...d.cargos] })));
});
