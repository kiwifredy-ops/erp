import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const rrhhRouter = Router();
rrhhRouter.use(requireAuth);

const NEXT_ESTADO = {
  Activo: ['Vacaciones', 'Licencia médica', 'Baja'],
  Vacaciones: ['Activo', 'Baja'],
  'Licencia médica': ['Activo', 'Baja'],
  Baja: [],
};

rrhhRouter.get('/empleados', async (req, res) => {
  const empleados = await prisma.empleado.findMany({
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(empleados);
});

rrhhRouter.post('/empleados', async (req, res) => {
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
    include: { bitacora: true },
  });
  res.status(201).json(empleado);
});

rrhhRouter.patch('/empleados/:id', async (req, res) => {
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
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(empleado);
});

rrhhRouter.post('/empleados/:id/estado', async (req, res) => {
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
    include: { bitacora: { orderBy: { fecha: 'asc' } } },
  });
  res.json(empleado);
});

rrhhRouter.get('/departamentos-resumen', async (req, res) => {
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
