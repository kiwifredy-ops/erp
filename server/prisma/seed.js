import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo2026!';

async function seedUsuarios() {
  const usuarios = [
    { nombre: 'Administrador General', email: 'admin@empresa.com', rol: 'Administrador del Sistema' },
    { nombre: 'Carolina Reyes', email: 'carolina.reyes@empresa.com', rol: 'RRHH' },
    { nombre: 'Marcelo Soto', email: 'marcelo.soto@empresa.com', rol: 'Jefe de Almacén' },
    { nombre: 'Fernanda Vidal', email: 'fernanda.vidal@empresa.com', rol: 'Finanzas' },
    { nombre: 'Diego Herrera', email: 'diego.herrera@empresa.com', rol: 'Supervisor de Operaciones' },
    { nombre: 'Pablo Contreras', email: 'pablo.contreras@empresa.com', rol: 'Técnico de Campo' },
    { nombre: 'Ignacio Rojas', email: 'gerencia@empresa.com', rol: 'Gerencia General' },
  ];
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const u of usuarios) {
    await prisma.usuario.upsert({ where: { email: u.email }, update: {}, create: { ...u, password: hash } });
  }
}

async function seedEmpleados() {
  const base = [
    { nombre: 'Carolina Reyes', documento: '15.204.887-3', cargo: 'Jefa de RRHH', departamento: 'Administración y Finanzas', tipoContrato: 'Indefinido', fechaIngreso: '2021-03-01', email: 'carolina.reyes@empresa.com', telefono: '+56 9 5551 2201' },
    { nombre: 'Marcelo Soto', documento: '16.887.221-9', cargo: 'Jefe de Almacén', departamento: 'Bodega y Logística', tipoContrato: 'Indefinido', fechaIngreso: '2020-06-15', email: 'marcelo.soto@empresa.com', telefono: '+56 9 5551 2202' },
    { nombre: 'Fernanda Vidal', documento: '17.332.410-5', cargo: 'Analista de Finanzas', departamento: 'Administración y Finanzas', tipoContrato: 'Indefinido', fechaIngreso: '2022-01-10', email: 'fernanda.vidal@empresa.com', telefono: '+56 9 5551 2203' },
    { nombre: 'Diego Herrera', documento: '18.004.556-2', cargo: 'Supervisor de Operaciones', departamento: 'Operaciones / Técnica', tipoContrato: 'Indefinido', fechaIngreso: '2019-09-05', email: 'diego.herrera@empresa.com', telefono: '+56 9 5551 2204' },
    { nombre: 'Pablo Contreras', documento: '19.115.667-8', cargo: 'Técnico de Instalación', departamento: 'Operaciones / Técnica', tipoContrato: 'Indefinido', fechaIngreso: '2023-02-20', email: 'pablo.contreras@empresa.com', telefono: '+56 9 5551 2205' },
    { nombre: 'Ignacio Rojas', documento: '14.998.320-1', cargo: 'Gerente General', departamento: 'Gerencia', tipoContrato: 'Indefinido', fechaIngreso: '2018-01-15', email: 'gerencia@empresa.com', telefono: '+56 9 5551 2206' },
    { nombre: 'Andrea Muñoz', documento: '20.556.112-4', cargo: 'Ejecutiva de Ventas', departamento: 'Ventas', tipoContrato: 'Plazo fijo', fechaIngreso: '2024-04-08', email: 'andrea.munoz@empresa.com', telefono: '+56 9 5551 2207' },
    { nombre: 'Rodrigo Fuentes', documento: '17.774.220-6', cargo: 'Técnico de Mantención', departamento: 'Operaciones / Técnica', tipoContrato: 'Indefinido', fechaIngreso: '2021-11-22', estado: 'Vacaciones', email: 'rodrigo.fuentes@empresa.com', telefono: '+56 9 5551 2208' },
    { nombre: 'Camila Torres', documento: '21.003.887-0', cargo: 'Asistente de Bodega', departamento: 'Bodega y Logística', tipoContrato: 'Plazo fijo', fechaIngreso: '2024-08-01', email: 'camila.torres@empresa.com', telefono: '+56 9 5551 2209' },
    { nombre: 'Sebastián Riquelme', documento: '16.221.998-7', cargo: 'Técnico de Instalación', departamento: 'Operaciones / Técnica', tipoContrato: 'Honorarios', fechaIngreso: '2022-07-18', estado: 'Licencia médica', email: 'sebastian.riquelme@empresa.com', telefono: '+56 9 5551 2210' },
    { nombre: 'Valentina Paredes', documento: '19.445.667-3', cargo: 'Encargada de Adquisiciones', departamento: 'Bodega y Logística', tipoContrato: 'Indefinido', fechaIngreso: '2020-10-12', email: 'valentina.paredes@empresa.com', telefono: '+56 9 5551 2211' },
    { nombre: 'Cristóbal Espinoza', documento: '18.667.334-5', cargo: 'Conductor / Técnico', departamento: 'Operaciones / Técnica', tipoContrato: 'Plazo fijo', fechaIngreso: '2023-05-30', estado: 'Baja', email: 'cristobal.espinoza@empresa.com', telefono: '+56 9 5551 2212' },
  ];
  for (const e of base) {
    const { estado, ...rest } = e;
    const existing = await prisma.empleado.findUnique({ where: { documento: e.documento } });
    if (existing) continue;
    await prisma.empleado.create({
      data: {
        ...rest,
        fechaIngreso: new Date(e.fechaIngreso),
        estado: estado || 'Activo',
        bitacora: { create: [{ fecha: new Date(e.fechaIngreso), evento: 'Contratación', detalle: `Ingreso como ${e.cargo} en ${e.departamento}.` }] },
      },
    });
  }
}

async function seedAlmacen() {
  const items = [
    { nombre: 'Cámara domo IP 4MP', categoria: 'Cámaras', unidad: 'unidad', stock: 34, stockMinimo: 10, ubicacion: 'Bodega A - Estante 3' },
    { nombre: 'Cámara bullet exterior 2MP', categoria: 'Cámaras', unidad: 'unidad', stock: 8, stockMinimo: 10, ubicacion: 'Bodega A - Estante 3' },
    { nombre: 'Sensor de movimiento PIR', categoria: 'Sensores', unidad: 'unidad', stock: 52, stockMinimo: 15, ubicacion: 'Bodega A - Estante 5' },
    { nombre: 'Sensor de apertura magnético', categoria: 'Sensores', unidad: 'unidad', stock: 6, stockMinimo: 15, ubicacion: 'Bodega A - Estante 5' },
    { nombre: 'Cable UTP cat6', categoria: 'Cableado', unidad: 'rollo', stock: 18, stockMinimo: 5, ubicacion: 'Bodega B - Estante 1' },
    { nombre: 'Panel de control de acceso', categoria: 'Control de Acceso', unidad: 'unidad', stock: 12, stockMinimo: 4, ubicacion: 'Bodega A - Estante 8' },
    { nombre: 'Central de alarma 8 zonas', categoria: 'Alarmas', unidad: 'unidad', stock: 9, stockMinimo: 3, ubicacion: 'Bodega A - Estante 10' },
    { nombre: 'Conectores RJ45', categoria: 'Consumibles', unidad: 'caja', stock: 22, stockMinimo: 8, ubicacion: 'Bodega B - Estante 2' },
  ];
  for (const it of items) {
    const existing = await prisma.item.findFirst({ where: { nombre: it.nombre } });
    if (existing) continue;
    await prisma.item.create({
      data: { ...it, movimientos: { create: [{ fecha: new Date('2026-07-01'), tipo: 'Entrada', cantidad: it.stock, motivo: 'Carga inicial de inventario' }] } },
    });
  }

  const equipos = [
    { equipo: 'Kit de herramientas #1', tipo: 'Herramientas', tecnico: 'Pablo Contreras', estado: 'Asignado', fechaAsignacion: '2026-06-10' },
    { equipo: 'Notebook de terreno #3', tipo: 'Electrónica', tecnico: 'Sebastián Riquelme', estado: 'Asignado', fechaAsignacion: '2026-05-22' },
    { equipo: 'Cámara de pruebas portátil', tipo: 'Electrónica', tecnico: null, estado: 'En bodega', fechaAsignacion: null },
  ];
  for (const e of equipos) {
    const existing = await prisma.equipo.findFirst({ where: { equipo: e.equipo } });
    if (existing) continue;
    await prisma.equipo.create({
      data: {
        ...e,
        fechaAsignacion: e.fechaAsignacion ? new Date(e.fechaAsignacion) : null,
        bitacora: {
          create: [
            e.tecnico
              ? { fecha: new Date(e.fechaAsignacion), evento: 'Asignación', detalle: `Entregado a ${e.tecnico}.` }
              : { fecha: new Date('2026-01-01'), evento: 'Registro', detalle: 'Equipo dado de alta en bodega.' },
          ],
        },
      },
    });
  }
}

async function seedGastos() {
  const rendiciones = [
    { tecnico: 'Pablo Contreras', fecha: '2026-08-05', estado: 'Pagada', lineas: [{ categoria: 'Combustible', monto: 32000, descripcion: 'Traslado a instalación cliente', fecha: '2026-08-01' }] },
    { tecnico: 'Rodrigo Fuentes', fecha: '2026-08-10', estado: 'Aprobada', lineas: [{ categoria: 'Alojamiento', monto: 45000, descripcion: 'Mantención en faena regional', fecha: '2026-08-08' }] },
    { tecnico: 'Sebastián Riquelme', fecha: '2026-08-14', estado: 'En revisión', lineas: [{ categoria: 'Combustible', monto: 28000, descripcion: 'Visita técnica cliente industrial', fecha: '2026-08-13' }] },
  ];
  const existingCount = await prisma.rendicion.count();
  if (existingCount > 0) return;
  let n = 1;
  for (const r of rendiciones) {
    await prisma.rendicion.create({
      data: {
        folio: `RG${String(n++).padStart(4, '0')}`,
        tecnico: r.tecnico,
        fecha: new Date(r.fecha),
        estado: r.estado,
        lineas: { create: r.lineas.map((l) => ({ ...l, fecha: new Date(l.fecha) })) },
        bitacora: { create: [{ fecha: new Date(r.fecha), evento: 'Rendición enviada', detalle: `Enviada por ${r.tecnico}.` }] },
      },
    });
  }
}

async function seedAsistencia() {
  const existingCount = await prisma.marcacion.count();
  if (existingCount > 0) return;
  const dias = ['2026-08-17', '2026-08-18', '2026-08-19'];
  const empleados = ['Pablo Contreras', 'Rodrigo Fuentes', 'Diego Herrera'];
  for (const fecha of dias) {
    for (const empleado of empleados) {
      await prisma.marcacion.create({
        data: { empleado, fecha: new Date(fecha), horaEntrada: '08:20', horaSalida: '18:00', estado: 'Normal', horasTrabajadas: 9.7 },
      });
    }
  }
}

async function seedFlota() {
  const existingCount = await prisma.vehiculo.count();
  if (existingCount > 0) return;
  const vehiculos = [
    { patente: 'BXRT-24', marca: 'Toyota', modelo: 'Hilux', anio: 2023, tipo: 'Camioneta', estado: 'Asignado', tecnico: 'Pablo Contreras', kilometraje: 34200, proximaMantencionKm: 40000 },
    { patente: 'DPVX-63', marca: 'Peugeot', modelo: 'Partner', anio: 2022, tipo: 'Furgón', estado: 'Disponible', tecnico: null, kilometraje: 41200, proximaMantencionKm: 50000 },
    { patente: 'MQCS-29', marca: 'Chevrolet', modelo: 'Sail', anio: 2023, tipo: 'Automóvil', estado: 'Disponible', tecnico: null, kilometraje: 9800, proximaMantencionKm: 20000 },
  ];
  for (const v of vehiculos) {
    await prisma.vehiculo.create({
      data: { ...v, bitacora: { create: [{ fecha: new Date('2026-01-15'), evento: 'Registro', detalle: 'Vehículo incorporado a la flota.' }] } },
    });
  }
}

async function seedAbastecimiento() {
  const proveedores = [
    { nombre: 'SecureTech Distribuidora', rubro: 'Cámaras y Sensores', contacto: 'ventas@securetech.cl', telefono: '+56 2 2345 6001' },
    { nombre: 'CableMax Ltda.', rubro: 'Cableado y Conectores', contacto: 'contacto@cablemax.cl', telefono: '+56 2 2345 6002' },
    { nombre: 'AccesoPro SpA', rubro: 'Control de Acceso', contacto: 'info@accesopro.cl', telefono: '+56 2 2345 6003' },
  ];
  for (const p of proveedores) {
    const existing = await prisma.proveedor.findFirst({ where: { nombre: p.nombre } });
    if (!existing) await prisma.proveedor.create({ data: p });
  }

  const existingOrdenes = await prisma.ordenCompra.count();
  if (existingOrdenes > 0) return;
  await prisma.ordenCompra.create({
    data: {
      folio: 'OC0001',
      proveedor: 'SecureTech Distribuidora',
      fecha: new Date('2026-08-01'),
      estado: 'Recibida',
      items: { create: [{ descripcion: 'Cámara domo IP 4MP', cantidad: 20, precioUnitario: 45000 }] },
      bitacora: { create: [{ fecha: new Date('2026-08-01'), evento: 'Orden solicitada', detalle: 'Solicitada a SecureTech Distribuidora.' }] },
    },
  });
}

async function main() {
  await seedUsuarios();
  await seedEmpleados();
  await seedAlmacen();
  await seedGastos();
  await seedAsistencia();
  await seedFlota();
  await seedAbastecimiento();
  console.log(`Seed completo. Usuarios demo, contraseña: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
