import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

function randomKey(prefix) {
  return `${prefix}${crypto.randomBytes(24).toString('hex')}`;
}

async function main() {
  if (process.env.DASHBOARD_SEED !== '1') {
    console.log('[seed] DASHBOARD_SEED!=1 — atlandi (prod guvenligi)');
    return;
  }

  const adminPass = process.env.DASHBOARD_ADMIN_PASSWORD || 'ChangeMeOnFirstLogin!';
  const fleetKey = process.env.DASHBOARD_FLEET_API_KEY || randomKey('sk_guardian_');

  console.log('Seeding Database (dev/demo)...');

  const defaultTenant = await prisma.tenant.upsert({
    where: { name: 'Default Tenant' },
    update: {},
    create: { id: 'default', name: 'Default Tenant' },
  });

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: hashPassword(adminPass) },
    create: {
      username: 'admin',
      passwordHash: hashPassword(adminPass),
      tenantId: defaultTenant.id,
      isAdmin: true,
    },
  });

  await prisma.apiKey.upsert({
    where: { key: fleetKey },
    update: {},
    create: {
      key: fleetKey,
      description: 'Fleet API Key (seed)',
      tenantId: defaultTenant.id,
    },
  });

  console.log('[seed] admin user: admin');
  console.log('[seed] fleet API key:', fleetKey);
  console.log('[seed] Set DASHBOARD_ADMIN_PASSWORD / DASHBOARD_FLEET_API_KEY to override.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
