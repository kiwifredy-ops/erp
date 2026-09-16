import { PrismaClient } from '@prisma/client';

// Cache de clientes Prisma por base de datos de tenant. Nunca instanciar un
// PrismaClient dentro de un handler de request: cada instancia abre su
// propio pool de conexiones contra MySQL, así que hay que reutilizarlas
// entre requests — este Map vive mientras viva el proceso del servidor.
const cache = new Map();

function buildTenantUrl(dbName) {
  const base = process.env.TENANT_DB_BASE_URL;
  if (!base) throw new Error('Falta la variable de entorno TENANT_DB_BASE_URL.');
  return `${base.replace(/\/$/, '')}/${dbName}`;
}

export function getTenantPrisma(dbName) {
  let client = cache.get(dbName);
  if (!client) {
    client = new PrismaClient({ datasources: { db: { url: buildTenantUrl(dbName) } } });
    cache.set(dbName, client);
  }
  return client;
}

// Se usa al eliminar/reprovisionar una empresa, para no dejar una conexión
// abierta a una base que ya no corresponde.
export async function clearTenantPrisma(dbName) {
  const client = cache.get(dbName);
  if (!client) return;
  cache.delete(dbName);
  await client.$disconnect();
}
