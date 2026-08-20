import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const asistenciaRouter = Router();
asistenciaRouter.use(requireAuth);

const HORA_ENTRADA_ESPERADA = '08:30';

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

asistenciaRouter.get('/marcaciones', async (req, res) => {
  const marcaciones = await prisma.marcacion.findMany({ orderBy: { fecha: 'desc' } });
  res.json(marcaciones);
});

asistenciaRouter.post('/marcaciones', async (req, res) => {
  const { empleado, fecha, horaEntrada } = req.body;
  const horaSalida = horaEntrada ? '18:00' : null;
  const marcacion = await prisma.marcacion.create({
    data: {
      empleado,
      fecha: new Date(fecha),
      horaEntrada,
      horaSalida,
      estado: calcularEstado(horaEntrada),
      horasTrabajadas: horasEntre(horaEntrada, horaSalida),
    },
  });
  res.status(201).json(marcacion);
});

asistenciaRouter.get('/resumen', async (req, res) => {
  const marcaciones = await prisma.marcacion.findMany();
  const porEmpleado = {};
  for (const m of marcaciones) {
    porEmpleado[m.empleado] ??= { empleado: m.empleado, diasRegistrados: 0, atrasos: 0, ausencias: 0, horasTotales: 0 };
    const r = porEmpleado[m.empleado];
    r.diasRegistrados += 1;
    if (m.estado === 'Atraso') r.atrasos += 1;
    if (m.estado === 'Ausencia') r.ausencias += 1;
    r.horasTotales += m.horasTrabajadas;
  }
  res.json(Object.values(porEmpleado).sort((a, b) => a.empleado.localeCompare(b.empleado)));
});
