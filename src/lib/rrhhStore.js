import { save, seedOnce } from './storage';

const EMPLEADOS_KEY = 'rrhh:empleados';

export const DEPARTAMENTOS = [
  'Operaciones / Técnica',
  'Ventas',
  'Administración y Finanzas',
  'Bodega y Logística',
  'Gerencia',
];

export const TIPOS_CONTRATO = ['Indefinido', 'Plazo fijo', 'Honorarios', 'Por obra o faena'];

export const ESTADOS_EMPLEADO = ['Activo', 'Vacaciones', 'Licencia médica', 'Baja'];

const NEXT_ESTADO = {
  Activo: ['Vacaciones', 'Licencia médica', 'Baja'],
  Vacaciones: ['Activo', 'Baja'],
  'Licencia médica': ['Activo', 'Baja'],
  Baja: [],
};

export function getNextEstados(estado) {
  return NEXT_ESTADO[estado] ?? [];
}

function seedEmpleados() {
  const base = [
    { nombre: 'Carolina Reyes', documento: '15.204.887-3', cargo: 'Jefa de RRHH', departamento: 'Administración y Finanzas', tipoContrato: 'Indefinido', fechaIngreso: '2021-03-01', estado: 'Activo', email: 'carolina.reyes@empresa.com', telefono: '+56 9 5551 2201' },
    { nombre: 'Marcelo Soto', documento: '16.887.221-9', cargo: 'Jefe de Almacén', departamento: 'Bodega y Logística', tipoContrato: 'Indefinido', fechaIngreso: '2020-06-15', estado: 'Activo', email: 'marcelo.soto@empresa.com', telefono: '+56 9 5551 2202' },
    { nombre: 'Fernanda Vidal', documento: '17.332.410-5', cargo: 'Analista de Finanzas', departamento: 'Administración y Finanzas', tipoContrato: 'Indefinido', fechaIngreso: '2022-01-10', estado: 'Activo', email: 'fernanda.vidal@empresa.com', telefono: '+56 9 5551 2203' },
    { nombre: 'Diego Herrera', documento: '18.004.556-2', cargo: 'Supervisor de Operaciones', departamento: 'Operaciones / Técnica', tipoContrato: 'Indefinido', fechaIngreso: '2019-09-05', estado: 'Activo', email: 'diego.herrera@empresa.com', telefono: '+56 9 5551 2204' },
    { nombre: 'Pablo Contreras', documento: '19.115.667-8', cargo: 'Técnico de Instalación', departamento: 'Operaciones / Técnica', tipoContrato: 'Indefinido', fechaIngreso: '2023-02-20', estado: 'Activo', email: 'pablo.contreras@empresa.com', telefono: '+56 9 5551 2205' },
    { nombre: 'Ignacio Rojas', documento: '14.998.320-1', cargo: 'Gerente General', departamento: 'Gerencia', tipoContrato: 'Indefinido', fechaIngreso: '2018-01-15', estado: 'Activo', email: 'gerencia@empresa.com', telefono: '+56 9 5551 2206' },
    { nombre: 'Andrea Muñoz', documento: '20.556.112-4', cargo: 'Ejecutiva de Ventas', departamento: 'Ventas', tipoContrato: 'Plazo fijo', fechaIngreso: '2024-04-08', estado: 'Activo', email: 'andrea.munoz@empresa.com', telefono: '+56 9 5551 2207' },
    { nombre: 'Rodrigo Fuentes', documento: '17.774.220-6', cargo: 'Técnico de Mantención', departamento: 'Operaciones / Técnica', tipoContrato: 'Indefinido', fechaIngreso: '2021-11-22', estado: 'Vacaciones', email: 'rodrigo.fuentes@empresa.com', telefono: '+56 9 5551 2208' },
    { nombre: 'Camila Torres', documento: '21.003.887-0', cargo: 'Asistente de Bodega', departamento: 'Bodega y Logística', tipoContrato: 'Plazo fijo', fechaIngreso: '2024-08-01', estado: 'Activo', email: 'camila.torres@empresa.com', telefono: '+56 9 5551 2209' },
    { nombre: 'Sebastián Riquelme', documento: '16.221.998-7', cargo: 'Técnico de Instalación', departamento: 'Operaciones / Técnica', tipoContrato: 'Honorarios', fechaIngreso: '2022-07-18', estado: 'Licencia médica', email: 'sebastian.riquelme@empresa.com', telefono: '+56 9 5551 2210' },
    { nombre: 'Valentina Paredes', documento: '19.445.667-3', cargo: 'Encargada de Adquisiciones', departamento: 'Bodega y Logística', tipoContrato: 'Indefinido', fechaIngreso: '2020-10-12', estado: 'Activo', email: 'valentina.paredes@empresa.com', telefono: '+56 9 5551 2211' },
    { nombre: 'Cristóbal Espinoza', documento: '18.667.334-5', cargo: 'Conductor / Técnico', departamento: 'Operaciones / Técnica', tipoContrato: 'Plazo fijo', fechaIngreso: '2023-05-30', estado: 'Baja', email: 'cristobal.espinoza@empresa.com', telefono: '+56 9 5551 2212' },
  ];

  return base.map((e, i) => ({
    id: `EMP${String(i + 1).padStart(4, '0')}`,
    ...e,
    bitacora: [
      {
        fecha: e.fechaIngreso,
        evento: 'Contratación',
        detalle: `Ingreso como ${e.cargo} en ${e.departamento}.`,
      },
    ],
  }));
}

export function getEmpleados() {
  return seedOnce(EMPLEADOS_KEY, seedEmpleados);
}

export function getEmpleado(id) {
  return getEmpleados().find((e) => e.id === id) ?? null;
}

export function crearEmpleado(data) {
  const empleados = getEmpleados();
  const nuevo = {
    id: `EMP${String(empleados.length + 1).padStart(4, '0')}`,
    ...data,
    estado: 'Activo',
    bitacora: [
      {
        fecha: data.fechaIngreso || new Date().toISOString().slice(0, 10),
        evento: 'Contratación',
        detalle: `Ingreso como ${data.cargo} en ${data.departamento}.`,
      },
    ],
  };
  const updated = [nuevo, ...empleados];
  save(EMPLEADOS_KEY, updated);
  return nuevo;
}

export function cambiarEstadoEmpleado(id, nuevoEstado, motivo) {
  const empleados = getEmpleados();
  const updated = empleados.map((e) => {
    if (e.id !== id) return e;
    return {
      ...e,
      estado: nuevoEstado,
      bitacora: [
        ...e.bitacora,
        {
          fecha: new Date().toISOString().slice(0, 10),
          evento: `Cambio de estado → ${nuevoEstado}`,
          detalle: motivo || '—',
        },
      ],
    };
  });
  save(EMPLEADOS_KEY, updated);
  return updated.find((e) => e.id === id);
}

export function editarEmpleado(id, cambios) {
  const empleados = getEmpleados();
  const before = empleados.find((e) => e.id === id);
  const camposEditables = { cargo: 'Cargo', departamento: 'Departamento', tipoContrato: 'Tipo de contrato' };
  const cambiosDetectados = Object.entries(cambios).filter(([k, v]) => before && before[k] !== v && camposEditables[k]);

  const updated = empleados.map((e) => {
    if (e.id !== id) return e;
    const bitacoraNueva = cambiosDetectados.map(([k, v]) => ({
      fecha: new Date().toISOString().slice(0, 10),
      evento: `Actualización de ${camposEditables[k]}`,
      detalle: `${camposEditables[k]}: ${before[k]} → ${v}`,
    }));
    return { ...e, ...cambios, bitacora: [...e.bitacora, ...bitacoraNueva] };
  });
  save(EMPLEADOS_KEY, updated);
  return updated.find((e) => e.id === id);
}
