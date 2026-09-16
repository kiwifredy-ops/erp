import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { prismaPlataforma } from '../prismaPlataforma.js';
import { getTenantPrisma } from '../tenantPrismaCache.js';
import { PERMISOS_POR_ROL, TODOS_LOS_MODULOS } from '../lib/permisosDefault.js';

const execAsync = promisify(exec);

// server/src/services -> server/ (raíz del proyecto de la API, donde vive
// prisma/schema.prisma y el binario local de Prisma en node_modules/.bin).
const SERVER_ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1');

const SLUG_REGEX = /^[a-z0-9_]{3,32}$/;

function buildBaseUrl() {
  const base = process.env.TENANT_DB_BASE_URL;
  if (!base) throw Object.assign(new Error('Falta la variable de entorno TENANT_DB_BASE_URL.'), { status: 500 });
  return base.replace(/\/$/, '');
}

function errorHttp(mensaje, status) {
  return Object.assign(new Error(mensaje), { status });
}

// Crea una empresa nueva de punta a punta: reserva su identificador y el
// correo de su primer administrador en la base de plataforma, crea su base
// de datos MySQL, le aplica el schema vigente (siempre corriendo "prisma db
// push" contra el schema real — nunca un dump estático que podría quedar
// desactualizado), crea su usuario administrador y siembra los permisos por
// defecto y los módulos incluidos en el plan elegido.
export async function provisionEmpresa({ nombre, slug, adminNombre, adminEmail, adminPassword, modulos }) {
  if (!nombre || !slug || !adminNombre || !adminEmail || !adminPassword) {
    throw errorHttp('Faltan datos para crear la empresa.', 400);
  }
  if (!SLUG_REGEX.test(slug)) {
    throw errorHttp('El identificador de la empresa debe tener entre 3 y 32 caracteres: minúsculas, números y guion bajo.', 400);
  }
  if (adminPassword.length < 6) {
    throw errorHttp('La contraseña debe tener al menos 6 caracteres.', 400);
  }

  const emailNormalizado = adminEmail.toLowerCase();
  const dbName = `erp_tenant_${slug}`;

  const [slugExistente, emailExistente] = await Promise.all([
    prismaPlataforma.empresa.findUnique({ where: { slug } }),
    prismaPlataforma.usuarioIndex.findUnique({ where: { email: emailNormalizado } }),
  ]);
  if (slugExistente) throw errorHttp('Ya existe una empresa con ese identificador.', 400);
  if (emailExistente) throw errorHttp('Ya existe un usuario con ese correo en la plataforma.', 400);

  const modulosElegidos = modulos?.length ? modulos.filter((m) => TODOS_LOS_MODULOS.includes(m)) : TODOS_LOS_MODULOS;

  // Se escribe primero en la base de plataforma como "reserva" del
  // slug/correo — no hay una transacción real posible entre esta base y la
  // base MySQL nueva que se crea después, así que si algo falla más
  // adelante se revierte manualmente (ver catch).
  const empresa = await prismaPlataforma.empresa.create({
    data: {
      nombre,
      slug,
      dbName,
      estado: 'Activa',
      modulos: { create: modulosElegidos.map((moduloId) => ({ moduloId, habilitado: true })) },
    },
  });

  try {
    await prismaPlataforma.usuarioIndex.create({ data: { email: emailNormalizado, empresaId: empresa.id } });

    const baseUrl = buildBaseUrl();
    const connection = await mysql.createConnection(baseUrl);
    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    } finally {
      await connection.end();
    }

    await execAsync('npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss', {
      cwd: SERVER_ROOT,
      env: { ...process.env, DATABASE_URL: `${baseUrl}/${dbName}` },
    });

    const tenantPrisma = getTenantPrisma(dbName);
    const hash = await bcrypt.hash(adminPassword, 10);
    await tenantPrisma.usuario.create({
      data: { nombre: adminNombre, email: emailNormalizado, rol: 'Administrador del Sistema', password: hash },
    });

    // Misma matriz que usa server/prisma/seed.js — así el primer usuario ya
    // tiene permisos completos y el resto de los roles queda listo para
    // cuando se creen usuarios con esos roles.
    for (const [rol, modulosPorRol] of Object.entries(PERMISOS_POR_ROL)) {
      for (const [moduloId, flags] of Object.entries(modulosPorRol)) {
        await tenantPrisma.rolPermiso.create({ data: { rol, moduloId, ...flags } });
      }
    }

    return empresa;
  } catch (err) {
    console.error(`Fallo al aprovisionar la empresa "${slug}", revirtiendo registro de plataforma:`, err);
    await prismaPlataforma.usuarioIndex.deleteMany({ where: { email: emailNormalizado } });
    await prismaPlataforma.empresa.delete({ where: { id: empresa.id } }).catch(() => {});
    throw errorHttp('No se pudo aprovisionar la empresa. Intenta de nuevo.', 500);
  }
}
