// Aplica el schema de tenant vigente (prisma/schema.prisma) a la base de
// datos de CADA empresa registrada en la plataforma — no solo a la que
// apunta DATABASE_URL. "npm run db:push" por sí solo únicamente actualiza
// esa base (la de la empresa inicial, ver bootstrap.js); toda empresa
// creada después vive en su propia base MySQL (erp_tenant_<slug>, ver
// tenantProvisioning.js) que quedaba fuera de ese comando. Sin este script,
// una columna nueva en el schema de tenant solo llegaba a empresas nuevas,
// dejando a las ya provisionadas con el schema viejo.
//
// Mismo patrón que server/prisma/seed.js y bootstrap.js: seguro de volver a
// ejecutar en cada despliegue (prisma db push es idempotente por diseño).

import 'dotenv/config';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { PrismaClient } from '../generated/plataforma-client/index.js';

const execAsync = promisify(exec);
const prismaPlataforma = new PrismaClient();

// server/prisma -> server/ (raíz del proyecto de la API).
const SERVER_ROOT = new URL('../', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1');

function buildBaseUrl() {
  const base = process.env.TENANT_DB_BASE_URL;
  if (!base) throw new Error('Falta la variable de entorno TENANT_DB_BASE_URL.');
  return base.replace(/\/$/, '');
}

async function main() {
  const empresas = await prismaPlataforma.empresa.findMany({ select: { nombre: true, dbName: true } });
  if (empresas.length === 0) {
    console.log('No hay empresas registradas todavía — nada que actualizar.');
    return;
  }

  const baseUrl = buildBaseUrl();
  for (const { nombre, dbName } of empresas) {
    process.stdout.write(`Aplicando schema a "${nombre}" (${dbName})... `);
    await execAsync('npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss', {
      cwd: SERVER_ROOT,
      env: { ...process.env, DATABASE_URL: `${baseUrl}/${dbName}` },
    });
    console.log('ok');
  }
  console.log(`Schema de tenant sincronizado en ${empresas.length} empresa(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaPlataforma.$disconnect();
  });
