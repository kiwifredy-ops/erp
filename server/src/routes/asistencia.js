import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermiso } from '../middleware/permisos.js';

export const asistenciaRouter = Router();
asistenciaRouter.use(requireAuth);

const V = requirePermiso('asistencia', 'ver');
const C = requirePermiso('asistencia', 'crear');
const E = requirePermiso('asistencia', 'editar');

const HORA_ENTRADA_ESPERADA = '08:30';
const JORNADA_NORMAL_HORAS = 9;

function horasEntre(entrada, salida) {
  if (!entrada || !salida) return 0;
  const [h1, m1] = entrada.split(':').map(Number);
  const [h2, m2] = salida.split(':').map(Number);
  return +(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60).toFixed(1);
}

function calcularEstado(entrada) {
  if (!entrada) return 'Ausencia';
  return entrada > HORA_ENTRADA_ESPERADA ? 'Atraso' : 'Normal';
}

asistenciaRouter.get('/marcaciones', V, async (req, res) => {
  const marcaciones = await prisma.marcacion.findMany({ orderBy: { fecha: 'desc' } });
  res.json(marcaciones);
});

asistenciaRouter.post('/marcaciones/entrada', C, async (req, res) => {
  const { empleado, fecha, hora, lat, lng } = req.body;
  const marcacion = await prisma.marcacion.create({
    data: {
      empleado,
      fecha: new Date(fecha),
      horaEntrada: hora,
      estado: calcularEstado(hora),
      latEntrada: lat ?? null,
      lngEntrada: lng ?? null,
    },
  });
  res.status(201).json(marcacion);
});

asistenciaRouter.post('/marcaciones/:id/salida', E, async (req, res) => {
  const { hora, lat, lng } = req.body;
  const before = await prisma.marcacion.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: 'Marcación no encontrada' });
  if (before.horaSalida) return res.status(400).json({ error: 'Esta marcación ya tiene salida registrada' });

  const horasTrabajadas = horasEntre(before.horaEntrada, hora);
  const marcacion = await prisma.marcacion.update({
    where: { id: req.params.id },
    data: {
      horaSalida: hora,
      horasTrabajadas,
      horasExtra: Math.max(0, +(horasTrabajadas - JORNADA_NORMAL_HORAS).toFixed(1)),
      latSalida: lat ?? null,
      lngSalida: lng ?? null,
    },
  });
  res.json(marcacion);
});

asistenciaRouter.get('/resumen', V, async (req, res) => {
  const marcaciones = await prisma.marcacion.findMany();
  const porEmpleado = {};
  for (const m of marcaciones) {
    porEmpleado[m.empleado] ??= { empleado: m.empleado, diasRegistrados: 0, atrasos: 0, ausencias: 0, horasTotales: 0, horasExtraTotales: 0 };
    const r = porEmpleado[m.empleado];
    r.diasRegistrados += 1;
    if (m.estado === 'Atraso') r.atrasos += 1;
    if (m.estado === 'Ausencia') r.ausencias += 1;
    r.horasTotales += m.horasTrabajadas;
    r.horasExtraTotales += m.horasExtra;
  }
  res.json(Object.values(porEmpleado).sort((a, b) => a.empleado.localeCompare(b.empleado)));
});
