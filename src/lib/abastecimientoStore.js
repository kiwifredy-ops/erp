import { save, seedOnce } from './storage';

const ORDENES_KEY = 'abastecimiento:ordenes';
const PROVEEDORES_KEY = 'abastecimiento:proveedores';

export const ESTADOS_ORDEN = ['Solicitada', 'Aprobada', 'En tránsito', 'Recibida', 'Rechazada'];
export const RUBROS_PROVEEDOR = ['Cámaras y Sensores', 'Cableado y Conectores', 'Control de Acceso', 'Alarmas', 'Ferretería', 'Servicios Generales'];

const NEXT_ESTADO = {
  Solicitada: ['Aprobada', 'Rechazada'],
  Aprobada: ['En tránsito'],
  'En tránsito': ['Recibida'],
  Recibida: [],
  Rechazada: [],
};

export function getNextEstados(estado) {
  return NEXT_ESTADO[estado] ?? [];
}

function total(items) {
  return items.reduce((sum, it) => sum + Number(it.cantidad || 0) * Number(it.precioUnitario || 0), 0);
}

function seedProveedores() {
  const base = [
    { nombre: 'SecureTech Distribuidora', rubro: 'Cámaras y Sensores', contacto: 'ventas@securetech.cl', telefono: '+56 2 2345 6001', activo: true },
    { nombre: 'CableMax Ltda.', rubro: 'Cableado y Conectores', contacto: 'contacto@cablemax.cl', telefono: '+56 2 2345 6002', activo: true },
    { nombre: 'AccesoPro SpA', rubro: 'Control de Acceso', contacto: 'info@accesopro.cl', telefono: '+56 2 2345 6003', activo: true },
    { nombre: 'AlarmSystems Chile', rubro: 'Alarmas', contacto: 'ventas@alarmsystems.cl', telefono: '+56 2 2345 6004', activo: true },
    { nombre: 'Ferretería Central', rubro: 'Ferretería', contacto: 'pedidos@ferrcentral.cl', telefono: '+56 2 2345 6005', activo: false },
  ];
  return base.map((p, i) => ({ id: `PRV${String(i + 1).padStart(4, '0')}`, ...p }));
}

function seedOrdenes() {
  const base = [
    {
      proveedor: 'SecureTech Distribuidora',
      fecha: '2026-08-01',
      estado: 'Recibida',
      items: [
        { descripcion: 'Cámara domo IP 4MP', cantidad: 20, precioUnitario: 45000 },
        { descripcion: 'Sensor de movimiento PIR', cantidad: 30, precioUnitario: 8500 },
      ],
    },
    {
      proveedor: 'CableMax Ltda.',
      fecha: '2026-08-08',
      estado: 'En tránsito',
      items: [
        { descripcion: 'Cable UTP cat6 (rollo)', cantidad: 15, precioUnitario: 32000 },
      ],
    },
    {
      proveedor: 'AccesoPro SpA',
      fecha: '2026-08-12',
      estado: 'Aprobada',
      items: [
        { descripcion: 'Panel de control de acceso', cantidad: 8, precioUnitario: 120000 },
        { descripcion: 'Lector biométrico', cantidad: 8, precioUnitario: 95000 },
      ],
    },
    {
      proveedor: 'AlarmSystems Chile',
      fecha: '2026-08-15',
      estado: 'Solicitada',
      items: [
        { descripcion: 'Central de alarma 8 zonas', cantidad: 5, precioUnitario: 180000 },
      ],
    },
    {
      proveedor: 'Ferretería Central',
      fecha: '2026-08-16',
      estado: 'Rechazada',
      items: [
        { descripcion: 'Tornillería surtida', cantidad: 50, precioUnitario: 3000 },
      ],
    },
  ];
  return base.map((o, i) => ({
    id: `OC${String(i + 1).padStart(4, '0')}`,
    ...o,
    bitacora: [{ fecha: o.fecha, evento: 'Orden solicitada', detalle: `Solicitada a ${o.proveedor}.` }],
  }));
}

export function getProveedores() {
  return seedOnce(PROVEEDORES_KEY, seedProveedores);
}

export function crearProveedor(data) {
  const proveedores = getProveedores();
  const nuevo = { id: `PRV${String(proveedores.length + 1).padStart(4, '0')}`, ...data, activo: true };
  save(PROVEEDORES_KEY, [nuevo, ...proveedores]);
  return nuevo;
}

export function toggleProveedorActivo(id) {
  const proveedores = getProveedores();
  const updated = proveedores.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p));
  save(PROVEEDORES_KEY, updated);
  return updated.find((p) => p.id === id);
}

export function getOrdenes() {
  return seedOnce(ORDENES_KEY, seedOrdenes);
}

export function getTotalOrden(orden) {
  return total(orden.items);
}

export function crearOrden(data) {
  const ordenes = getOrdenes();
  const nueva = {
    id: `OC${String(ordenes.length + 1).padStart(4, '0')}`,
    proveedor: data.proveedor,
    fecha: data.fecha,
    estado: 'Solicitada',
    items: data.items,
    bitacora: [{ fecha: data.fecha, evento: 'Orden solicitada', detalle: `Solicitada a ${data.proveedor}.` }],
  };
  save(ORDENES_KEY, [nueva, ...ordenes]);
  return nueva;
}

export function cambiarEstadoOrden(id, nuevoEstado, motivo) {
  const ordenes = getOrdenes();
  const updated = ordenes.map((o) => {
    if (o.id !== id) return o;
    return {
      ...o,
      estado: nuevoEstado,
      bitacora: [...o.bitacora, { fecha: new Date().toISOString().slice(0, 10), evento: `Cambio de estado → ${nuevoEstado}`, detalle: motivo || '—' }],
    };
  });
  save(ORDENES_KEY, updated);
  return updated.find((o) => o.id === id);
}
