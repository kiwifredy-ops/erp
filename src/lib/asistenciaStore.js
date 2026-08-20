import { save, seedOnce } from './storage';

const MARCACIONES_KEY = 'asistencia:marcaciones';

export const HORA_ENTRADA_ESPERADA = '08:30';

function horasEntreHoras(entrada, salida) {
  if (!entrada || !salida) return 0;
  const [h1, m1] = entrada.split(':').map(Number);
  const [h2, m2] = salida.split(':').map(Number);
  return +(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60).toFixed(1);
}

function calcularEstado(entrada) {
  if (!entrada) return 'Ausencia';
  return entrada > HORA_ENTRADA_ESPERADA ? 'Atraso' : 'Normal';
}

const EMPLEADOS_DEMO = ['Pablo Contreras', 'Rodrigo Fuentes', 'Sebastián Riquelme', 'Diego Herrera', 'Marcelo Soto', 'Camila Torres', 'Andrea Muñoz'];

function seedMarcaciones() {
  const dias = [
    { fecha: '2026-08-12', entradas: { 'Pablo Contreras': '08:24', 'Rodrigo Fuentes': '08:31', 'Sebastián Riquelme': '08:20', 'Diego Herrera': '08:15', 'Marcelo Soto': '08:28', 'Camila Torres': '08:33', 'Andrea Muñoz': '08:29' } },
    { fecha: '2026-08-13', entradas: { 'Pablo Contreras': '08:19', 'Rodrigo Fuentes': '08:22', 'Sebastián Riquelme': null, 'Diego Herrera': '08:10', 'Marcelo Soto': '08:35', 'Camila Torres': '08:27', 'Andrea Muñoz': '08:31' } },
    { fecha: '2026-08-14', entradas: { 'Pablo Contreras': '08:45', 'Rodrigo Fuentes': '08:18', 'Sebastián Riquelme': '08:25', 'Diego Herrera': '08:12', 'Marcelo Soto': '08:30', 'Camila Torres': '08:29', 'Andrea Muñoz': '08:22' } },
    { fecha: '2026-08-17', entradas: { 'Pablo Contreras': '08:20', 'Rodrigo Fuentes': '08:16', 'Sebastián Riquelme': '08:33', 'Diego Herrera': '08:08', 'Marcelo Soto': '08:26', 'Camila Torres': null, 'Andrea Muñoz': '08:24' } },
    { fecha: '2026-08-18', entradas: { 'Pablo Contreras': '08:22', 'Rodrigo Fuentes': '08:41', 'Sebastián Riquelme': '08:19', 'Diego Herrera': '08:14', 'Marcelo Soto': '08:29', 'Camila Torres': '08:25', 'Andrea Muñoz': '08:30' } },
    { fecha: '2026-08-19', entradas: { 'Pablo Contreras': '08:18', 'Rodrigo Fuentes': '08:20', 'Sebastián Riquelme': '08:27', 'Diego Herrera': '08:11', 'Marcelo Soto': '08:24', 'Camila Torres': '08:28', 'Andrea Muñoz': '08:19' } },
  ];

  const registros = [];
  let n = 1;
  for (const dia of dias) {
    for (const empleado of EMPLEADOS_DEMO) {
      const entrada = dia.entradas[empleado];
      const salida = entrada ? '18:00' : null;
      registros.push({
        id: `MRC${String(n++).padStart(4, '0')}`,
        empleado,
        fecha: dia.fecha,
        horaEntrada: entrada,
        horaSalida: salida,
        estado: calcularEstado(entrada),
        horasTrabajadas: horasEntreHoras(entrada, salida),
      });
    }
  }
  return registros;
}

export function getMarcaciones() {
  return seedOnce(MARCACIONES_KEY, seedMarcaciones);
}

export function registrarMarcacion(empleado, fecha, horaEntrada) {
  const marcaciones = getMarcaciones();
  const nueva = {
    id: `MRC${String(marcaciones.length + 1).padStart(4, '0')}`,
    empleado,
    fecha,
    horaEntrada,
    horaSalida: '18:00',
    estado: calcularEstado(horaEntrada),
    horasTrabajadas: horasEntreHoras(horaEntrada, '18:00'),
  };
  save(MARCACIONES_KEY, [nueva, ...marcaciones]);
  return nueva;
}

export function resumenPorEmpleado() {
  const marcaciones = getMarcaciones();
  const porEmpleado = {};
  for (const m of marcaciones) {
    if (!porEmpleado[m.empleado]) {
      porEmpleado[m.empleado] = { empleado: m.empleado, diasRegistrados: 0, atrasos: 0, ausencias: 0, horasTotales: 0 };
    }
    const r = porEmpleado[m.empleado];
    r.diasRegistrados += 1;
    if (m.estado === 'Atraso') r.atrasos += 1;
    if (m.estado === 'Ausencia') r.ausencias += 1;
    r.horasTotales += m.horasTrabajadas;
  }
  return Object.values(porEmpleado).sort((a, b) => a.empleado.localeCompare(b.empleado));
}
