// Arranque único e idempotente de la base de plataforma: crea el primer
// súper administrador y registra la base de datos que YA existe (la de
// producción, apuntada por DATABASE_URL) como la primera empresa —así los
// usuarios que ya existen hoy pueden seguir iniciando sesión sin
// interrupción una vez activado el modo multi-cliente.
//
// Mismo patrón que server/prisma/seed.js: cada paso revisa si ya hay datos
// antes de crear algo, por lo que es seguro volver a ejecutarlo en cada
// despliegue.

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../../generated/plataforma-client/index.js';
import { prisma as prismaTenantInicial } from '../../src/prisma.js';
import { TODOS_LOS_MODULOS } from '../../src/lib/permisosDefault.js';

const prismaPlataforma = new PrismaClient();

function extraerNombreBase(databaseUrl) {
  const match = databaseUrl?.match(/\/([^/?]+)(\?.*)?$/);
  if (!match) throw new Error('No se pudo extraer el nombre de la base de datos de DATABASE_URL.');
  return match[1];
}

async function crearSuperAdmin() {
  const existente = await prismaPlataforma.superUsuario.count();
  if (existente > 0) return;

  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Faltan las variables de entorno SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD.');
  }

  const hash = await bcrypt.hash(password, 10);
  await prismaPlataforma.superUsuario.create({
    data: { nombre: 'Súper Administrador', email: email.toLowerCase(), password: hash },
  });
  console.log('Súper administrador de plataforma creado.');
}

async function registrarEmpresaInicial() {
  const existente = await prismaPlataforma.empresa.count();
  if (existente > 0) return;

  const dbName = extraerNombreBase(process.env.DATABASE_URL);
  const empresa = await prismaPlataforma.empresa.create({
    data: {
      nombre: process.env.EMPRESA_INICIAL_NOMBRE || 'Empresa Principal',
      slug: process.env.EMPRESA_INICIAL_SLUG || 'principal',
      dbName,
      estado: 'Activa',
      modulos: { create: TODOS_LOS_MODULOS.map((moduloId) => ({ moduloId, habilitado: true })) },
    },
  });

  const usuarios = await prismaTenantInicial.usuario.findMany({ select: { email: true } });
  for (const u of usuarios) {
    await prismaPlataforma.usuarioIndex.upsert({
      where: { email: u.email.toLowerCase() },
      update: {},
      create: { email: u.email.toLowerCase(), empresaId: empresa.id },
    });
  }
  console.log(`Empresa inicial "${empresa.nombre}" registrada (${usuarios.length} usuario(s) indexado(s)).`);
}

async function main() {
  await crearSuperAdmin();
  await registrarEmpresaInicial();
  console.log('Bootstrap de plataforma completo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaPlataforma.$disconnect();
    await prismaTenantInicial.$disconnect();
  });
