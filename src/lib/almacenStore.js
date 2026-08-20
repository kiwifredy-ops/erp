import { save, seedOnce } from './storage';

const ITEMS_KEY = 'almacen:items';
const EQUIPOS_KEY = 'almacen:equipos';

export const CATEGORIAS_ITEM = ['Cámaras', 'Sensores', 'Cableado', 'Control de Acceso', 'Alarmas', 'Herramientas', 'Consumibles'];
export const UNIDADES = ['unidad', 'metro', 'caja', 'rollo'];

function seedItems() {
  const base = [
    { nombre: 'Cámara domo IP 4MP', categoria: 'Cámaras', unidad: 'unidad', stock: 34, stockMinimo: 10, ubicacion: 'Bodega A - Estante 3' },
    { nombre: 'Cámara bullet exterior 2MP', categoria: 'Cámaras', unidad: 'unidad', stock: 8, stockMinimo: 10, ubicacion: 'Bodega A - Estante 3' },
    { nombre: 'Sensor de movimiento PIR', categoria: 'Sensores', unidad: 'unidad', stock: 52, stockMinimo: 15, ubicacion: 'Bodega A - Estante 5' },
    { nombre: 'Sensor de apertura magnético', categoria: 'Sensores', unidad: 'unidad', stock: 6, stockMinimo: 15, ubicacion: 'Bodega A - Estante 5' },
    { nombre: 'Cable UTP cat6', categoria: 'Cableado', unidad: 'rollo', stock: 18, stockMinimo: 5, ubicacion: 'Bodega B - Estante 1' },
    { nombre: 'Cable coaxial RG59', categoria: 'Cableado', unidad: 'rollo', stock: 3, stockMinimo: 5, ubicacion: 'Bodega B - Estante 1' },
    { nombre: 'Panel de control de acceso', categoria: 'Control de Acceso', unidad: 'unidad', stock: 12, stockMinimo: 4, ubicacion: 'Bodega A - Estante 8' },
    { nombre: 'Lector biométrico', categoria: 'Control de Acceso', unidad: 'unidad', stock: 7, stockMinimo: 4, ubicacion: 'Bodega A - Estante 8' },
    { nombre: 'Central de alarma 8 zonas', categoria: 'Alarmas', unidad: 'unidad', stock: 9, stockMinimo: 3, ubicacion: 'Bodega A - Estante 10' },
    { nombre: 'Sirena exterior', categoria: 'Alarmas', unidad: 'unidad', stock: 15, stockMinimo: 5, ubicacion: 'Bodega A - Estante 10' },
    { nombre: 'Taladro percutor', categoria: 'Herramientas', unidad: 'unidad', stock: 6, stockMinimo: 2, ubicacion: 'Bodega C - Herramientas' },
    { nombre: 'Multitester digital', categoria: 'Herramientas', unidad: 'unidad', stock: 4, stockMinimo: 2, ubicacion: 'Bodega C - Herramientas' },
    { nombre: 'Conectores RJ45', categoria: 'Consumibles', unidad: 'caja', stock: 22, stockMinimo: 8, ubicacion: 'Bodega B - Estante 2' },
    { nombre: 'Tornillería y tarugos', categoria: 'Consumibles', unidad: 'caja', stock: 30, stockMinimo: 10, ubicacion: 'Bodega B - Estante 2' },
  ];
  return base.map((it, i) => ({
    id: `ITM${String(i + 1).padStart(4, '0')}`,
    ...it,
    movimientos: [
      { fecha: '2026-07-01', tipo: 'Entrada', cantidad: it.stock, motivo: 'Carga inicial de inventario' },
    ],
  }));
}

function seedEquipos() {
  const base = [
    { equipo: 'Kit de herramientas #1', tipo: 'Herramientas', tecnico: 'Pablo Contreras', estado: 'Asignado', fechaAsignacion: '2026-06-10' },
    { equipo: 'Notebook de terreno #3', tipo: 'Electrónica', tecnico: 'Sebastián Riquelme', estado: 'Asignado', fechaAsignacion: '2026-05-22' },
    { equipo: 'Cámara de pruebas portátil', tipo: 'Electrónica', tecnico: null, estado: 'En bodega', fechaAsignacion: null },
    { equipo: 'Kit de herramientas #2', tipo: 'Herramientas', tecnico: 'Rodrigo Fuentes', estado: 'Asignado', fechaAsignacion: '2026-04-15' },
    { equipo: 'Multímetro de precisión', tipo: 'Herramientas', tecnico: null, estado: 'En mantención', fechaAsignacion: null },
  ];
  return base.map((e, i) => ({
    id: `EQP${String(i + 1).padStart(4, '0')}`,
    ...e,
    bitacora: e.tecnico
      ? [{ fecha: e.fechaAsignacion, evento: 'Asignación', detalle: `Entregado a ${e.tecnico}.` }]
      : [{ fecha: '2026-01-01', evento: 'Registro', detalle: 'Equipo dado de alta en bodega.' }],
  }));
}

export function getItems() {
  return seedOnce(ITEMS_KEY, seedItems);
}

export function crearItem(data) {
  const items = getItems();
  const nuevo = {
    id: `ITM${String(items.length + 1).padStart(4, '0')}`,
    ...data,
    stock: Number(data.stock) || 0,
    stockMinimo: Number(data.stockMinimo) || 0,
    movimientos: [{ fecha: new Date().toISOString().slice(0, 10), tipo: 'Entrada', cantidad: Number(data.stock) || 0, motivo: 'Carga inicial de inventario' }],
  };
  save(ITEMS_KEY, [nuevo, ...items]);
  return nuevo;
}

export function registrarMovimiento(itemId, tipo, cantidad, motivo) {
  const items = getItems();
  const updated = items.map((it) => {
    if (it.id !== itemId) return it;
    const delta = tipo === 'Entrada' ? cantidad : -cantidad;
    return {
      ...it,
      stock: Math.max(0, it.stock + delta),
      movimientos: [...it.movimientos, { fecha: new Date().toISOString().slice(0, 10), tipo, cantidad, motivo: motivo || '—' }],
    };
  });
  save(ITEMS_KEY, updated);
  return updated.find((it) => it.id === itemId);
}

export function getEquipos() {
  return seedOnce(EQUIPOS_KEY, seedEquipos);
}

export function asignarEquipo(id, tecnico) {
  const equipos = getEquipos();
  const updated = equipos.map((e) => {
    if (e.id !== id) return e;
    return {
      ...e,
      estado: 'Asignado',
      tecnico,
      fechaAsignacion: new Date().toISOString().slice(0, 10),
      bitacora: [...e.bitacora, { fecha: new Date().toISOString().slice(0, 10), evento: 'Asignación', detalle: `Entregado a ${tecnico}.` }],
    };
  });
  save(EQUIPOS_KEY, updated);
  return updated.find((e) => e.id === id);
}

export function devolverEquipo(id) {
  const equipos = getEquipos();
  const updated = equipos.map((e) => {
    if (e.id !== id) return e;
    return {
      ...e,
      estado: 'En bodega',
      bitacora: [...e.bitacora, { fecha: new Date().toISOString().slice(0, 10), evento: 'Devolución', detalle: `Devuelto por ${e.tecnico}.` }],
      tecnico: null,
    };
  });
  save(EQUIPOS_KEY, updated);
  return updated.find((e) => e.id === id);
}
