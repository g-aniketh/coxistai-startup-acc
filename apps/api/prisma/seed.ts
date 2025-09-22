import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample tenants
  const tenant1 = await prisma.tenant.upsert({
    where: { id: 'tenant-1' },
    update: {},
    create: {
      id: 'tenant-1',
      name: 'CoXist AI Accelerator',
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { id: 'tenant-2' },
    update: {},
    create: {
      id: 'tenant-2',
      name: 'TechStart Inc',
    },
  });

  console.log('✅ Created tenants:', { tenant1, tenant2 });

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@coxist.ai' },
    update: {},
    create: {
      email: 'admin@coxist.ai',
      passwordHash: 'hashed_password_here', // In real app, hash the password
      role: 'admin',
      tenantId: tenant1.id,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'member@coxist.ai' },
    update: {},
    create: {
      email: 'member@coxist.ai',
      passwordHash: 'hashed_password_here', // In real app, hash the password
      role: 'member',
      tenantId: tenant1.id,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'ceo@techstart.com' },
    update: {},
    create: {
      email: 'ceo@techstart.com',
      passwordHash: 'hashed_password_here', // In real app, hash the password
      role: 'admin',
      tenantId: tenant2.id,
    },
  });

  console.log('✅ Created users:', { user1, user2, user3 });

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
