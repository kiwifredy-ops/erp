import { save, seedOnce } from './storage';

const RENDICIONES_KEY = 'gastos:rendiciones';

export const CATEGORIAS_GASTO = ['Combustible', 'Peajes', 'Alojamiento', 'Alimentación', 'Estacionamiento', 'Otros'];

export const ESTADOS_RENDICION = ['Enviada', 'En revisión', 'Aprobada', 'Rechazada', 'Pagada'];

const NEXT_ESTADO = {
  Enviada: ['En revisión', 'Rechazada'],
  'En revisión': ['Aprobada', 'Rechazada'],
  Aprobada: ['Pagada'],
  Rechazada: [],
  Pagada: [],
};

export function getNextEstados(estado) {
  return NEXT_ESTADO[estado] ?? [];
}

function total(lineas) {
  return lineas.reduce((sum, l) => sum + Number(l.monto || 0), 0);
}

function seedRendiciones() {
  const base = [
    {
      tecnico: 'Pablo Contreras',
      fecha: '2026-08-05',
      estado: 'Pagada',
      lineas: [
        { categoria: 'Combustible', monto: 32000, descripcion: 'Traslado a instalación cliente Las Condes', fecha: '2026-08-01' },
        { categoria: 'Peajes', monto: 6500, descripcion: 'Autopista Costanera Norte', fecha: '2026-08-01' },
      ],
    },
    {
      tecnico: 'Rodrigo Fuentes',
      fecha: '2026-08-10',
      estado: 'Aprobada',
      lineas: [
        { categoria: 'Alojamiento', monto: 45000, descripcion: 'Mantención en faena regional, 1 noche', fecha: '2026-08-08' },
        { categoria: 'Alimentación', monto: 18000, descripcion: 'Viáticos jornada completa', fecha: '2026-08-08' },
      ],
    },
    {
      tecnico: 'Sebastián Riquelme',
      fecha: '2026-08-14',
      estado: 'En revisión',
      lineas: [
        { categoria: 'Combustible', monto: 28000, descripcion: 'Visita técnica cliente industrial', fecha: '2026-08-13' },
      ],
    },
    {
      tecnico: 'Cristóbal Espinoza',
      fecha: '2026-08-16',
      estado: 'Enviada',
      lineas: [
        { categoria: 'Estacionamiento', monto: 4000, descripcion: 'Estacionamiento en edificio corporativo', fecha: '2026-08-15' },
        { categoria: 'Peajes', monto: 3200, descripcion: 'Ruta hacia sucursal norte', fecha: '2026-08-15' },
      ],
    },
    {
      tecnico: 'Pablo Contreras',
      fecha: '2026-08-17',
      estado: 'Rechazada',
      lineas: [
        { categoria: 'Otros', monto: 15000, descripcion: 'Compra de materiales sin respaldo', fecha: '2026-08-16' },
      ],
    },
  ];

  return base.map((r, i) => ({
    id: `RG${String(i + 1).padStart(4, '0')}`,
    ...r,
    bitacora: [{ fecha: r.fecha, evento: 'Rendición enviada', detalle: `Enviada por ${r.tecnico}.` }],
  }));
}

export function getRendiciones() {
  return seedOnce(RENDICIONES_KEY, seedRendiciones);
}

export function getTotal(rendicion) {
  return total(rendicion.lineas);
}

export function crearRendicion(data) {
  const rendiciones = getRendiciones();
  const nueva = {
    id: `RG${String(rendiciones.length + 1).padStart(4, '0')}`,
    tecnico: data.tecnico,
    fecha: data.fecha,
    estado: 'Enviada',
    lineas: data.lineas,
    bitacora: [{ fecha: data.fecha, evento: 'Rendición enviada', detalle: `Enviada por ${data.tecnico}.` }],
  };
  save(RENDICIONES_KEY, [nueva, ...rendiciones]);
  return nueva;
}

export function cambiarEstadoRendicion(id, nuevoEstado, motivo) {
  const rendiciones = getRendiciones();
  const updated = rendiciones.map((r) => {
    if (r.id !== id) return r;
    return {
      ...r,
      estado: nuevoEstado,
      bitacora: [...r.bitacora, { fecha: new Date().toISOString().slice(0, 10), evento: `Cambio de estado → ${nuevoEstado}`, detalle: motivo || '—' }],
    };
  });
  save(RENDICIONES_KEY, updated);
  return updated.find((r) => r.id === id);
}
