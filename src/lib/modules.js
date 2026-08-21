import { Users, Warehouse, Receipt, Fingerprint, Truck, PackageSearch, Landmark, Ticket } from 'lucide-react';

export const MODULES = [
  {
    id: 'rrhh',
    nombre: 'Administración de RRHH',
    descripcion: 'Empleados, cargos, departamentos y ciclo de vida laboral.',
    icon: Users,
  },
  {
    id: 'almacen',
    nombre: 'Almacén y Logística',
    descripcion: 'Inventario, materiales, equipos y movimientos de bodega.',
    icon: Warehouse,
  },
  {
    id: 'gastos',
    nombre: 'Rendición de Gastos',
    descripcion: 'Gastos de personal técnico en terreno, aprobación y reembolso.',
    icon: Receipt,
  },
  {
    id: 'asistencia',
    nombre: 'Asistencia',
    descripcion: 'Marcaciones, turnos y control de asistencia del personal.',
    icon: Fingerprint,
  },
  {
    id: 'flota',
    nombre: 'Flota de Vehículos',
    descripcion: 'Vehículos, asignaciones, mantenciones y documentación.',
    icon: Truck,
  },
  {
    id: 'abastecimiento',
    nombre: 'Abastecimiento',
    descripcion: 'Órdenes de compra, proveedores y solicitudes de material.',
    icon: PackageSearch,
  },
  {
    id: 'contabilidad',
    nombre: 'Contabilidad',
    descripcion: 'Facturas de venta y compra, notas de crédito, pagos y cuentas bancarias.',
    icon: Landmark,
  },
  {
    id: 'tickets',
    nombre: 'Tickets de Servicio',
    descripcion: 'Mesa de ayuda, técnicos en terreno con GPS, fotos/video, firma y encuesta del cliente.',
    icon: Ticket,
  },
];

// Modules with a real, interactive implementation. The rest render as
// "próximamente" placeholders until built (build proceeds one module at a
// time, with a check-in before moving to the next).
export const IMPLEMENTED_MODULES = ['rrhh', 'almacen', 'gastos', 'asistencia', 'flota', 'abastecimiento', 'contabilidad', 'tickets'];

export function getModule(id) {
  return MODULES.find((m) => m.id === id);
}
