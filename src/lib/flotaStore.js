import { save, seedOnce } from './storage';

const VEHICULOS_KEY = 'flota:vehiculos';

export const TIPOS_VEHICULO = ['Camioneta', 'Furgón', 'Automóvil'];
export const ESTADOS_VEHICULO = ['Disponible', 'Asignado', 'En mantención', 'Fuera de servicio'];

const NEXT_ESTADO = {
  Disponible: ['Asignado', 'En mantención', 'Fuera de servicio'],
  Asignado: ['Disponible', 'En mantención'],
  'En mantención': ['Disponible', 'Fuera de servicio'],
  'Fuera de servicio': ['En mantención'],
};

export function getNextEstados(estado) {
  return NEXT_ESTADO[estado] ?? [];
}

function seedVehiculos() {
  const base = [
    { patente: 'BXRT-24', marca: 'Toyota', modelo: 'Hilux', anio: 2023, tipo: 'Camioneta', estado: 'Asignado', tecnico: 'Pablo Contreras', kilometraje: 34200, proximaMantencionKm: 40000 },
    { patente: 'GKLM-11', marca: 'Chevrolet', modelo: 'N300', anio: 2022, tipo: 'Furgón', estado: 'Asignado', tecnico: 'Rodrigo Fuentes', kilometraje: 58900, proximaMantencionKm: 60000 },
    { patente: 'FRWZ-87', marca: 'Toyota', modelo: 'Hilux', anio: 2024, tipo: 'Camioneta', estado: 'Asignado', tecnico: 'Sebastián Riquelme', kilometraje: 12100, proximaMantencionKm: 20000 },
    { patente: 'JHTN-45', marca: 'Nissan', modelo: 'NP300', anio: 2021, tipo: 'Camioneta', estado: 'En mantención', tecnico: null, kilometraje: 76500, proximaMantencionKm: 80000 },
    { patente: 'DPVX-63', marca: 'Peugeot', modelo: 'Partner', anio: 2022, tipo: 'Furgón', estado: 'Disponible', tecnico: null, kilometraje: 41200, proximaMantencionKm: 50000 },
    { patente: 'MQCS-29', marca: 'Chevrolet', modelo: 'Sail', anio: 2023, tipo: 'Automóvil', estado: 'Disponible', tecnico: null, kilometraje: 9800, proximaMantencionKm: 20000 },
    { patente: 'TLGB-72', marca: 'Nissan', modelo: 'NP300', anio: 2020, tipo: 'Camioneta', estado: 'Fuera de servicio', tecnico: null, kilometraje: 112300, proximaMantencionKm: 115000 },
  ];
  return base.map((v, i) => ({
    id: `VEH${String(i + 1).padStart(4, '0')}`,
    ...v,
    bitacora: [
      { fecha: '2026-01-15', evento: 'Registro', detalle: 'Vehículo incorporado a la flota.' },
      ...(v.tecnico ? [{ fecha: '2026-03-01', evento: 'Asignación', detalle: `Asignado a ${v.tecnico}.` }] : []),
    ],
  }));
}

export function getVehiculos() {
  return seedOnce(VEHICULOS_KEY, seedVehiculos);
}

export function crearVehiculo(data) {
  const vehiculos = getVehiculos();
  const nuevo = {
    id: `VEH${String(vehiculos.length + 1).padStart(4, '0')}`,
    ...data,
    kilometraje: Number(data.kilometraje) || 0,
    proximaMantencionKm: Number(data.proximaMantencionKm) || 0,
    estado: 'Disponible',
    tecnico: null,
    bitacora: [{ fecha: new Date().toISOString().slice(0, 10), evento: 'Registro', detalle: 'Vehículo incorporado a la flota.' }],
  };
  save(VEHICULOS_KEY, [nuevo, ...vehiculos]);
  return nuevo;
}

export function asignarVehiculo(id, tecnico) {
  const vehiculos = getVehiculos();
  const updated = vehiculos.map((v) => {
    if (v.id !== id) return v;
    return {
      ...v,
      estado: 'Asignado',
      tecnico,
      bitacora: [...v.bitacora, { fecha: new Date().toISOString().slice(0, 10), evento: 'Asignación', detalle: `Asignado a ${tecnico}.` }],
    };
  });
  save(VEHICULOS_KEY, updated);
  return updated.find((v) => v.id === id);
}

export function cambiarEstadoVehiculo(id, nuevoEstado, motivo) {
  const vehiculos = getVehiculos();
  const updated = vehiculos.map((v) => {
    if (v.id !== id) return v;
    return {
      ...v,
      estado: nuevoEstado,
      tecnico: nuevoEstado === 'Disponible' || nuevoEstado === 'En mantención' || nuevoEstado === 'Fuera de servicio' ? null : v.tecnico,
      bitacora: [...v.bitacora, { fecha: new Date().toISOString().slice(0, 10), evento: `Cambio de estado → ${nuevoEstado}`, detalle: motivo || '—' }],
    };
  });
  save(VEHICULOS_KEY, updated);
  return updated.find((v) => v.id === id);
}

export function registrarMantencion(id, kmActual, detalle) {
  const vehiculos = getVehiculos();
  const updated = vehiculos.map((v) => {
    if (v.id !== id) return v;
    const km = Number(kmActual) || v.kilometraje;
    return {
      ...v,
      kilometraje: km,
      proximaMantencionKm: km + 10000,
      bitacora: [...v.bitacora, { fecha: new Date().toISOString().slice(0, 10), evento: 'Mantención registrada', detalle: detalle || `Servicio realizado a los ${km} km.` }],
    };
  });
  save(VEHICULOS_KEY, updated);
  return updated.find((v) => v.id === id);
}
