/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      mustChangePassword: false,
      passwordHash,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Usuario Demo',
      role: 'USER',
      mustChangePassword: false,
      passwordHash: await bcrypt.hash('user123', 10),
    },
  });

  const netflix = await prisma.service.upsert({
    where: { name: 'Netflix' },
    update: {},
    create: {
      name: 'Netflix',
      monthlyCost: 229.0,
      maxProfiles: 5,
      isActive: true,
    },
  });

  const spotify = await prisma.service.upsert({
    where: { name: 'Spotify' },
    update: {},
    create: {
      name: 'Spotify',
      monthlyCost: 99.0,
      maxProfiles: 6,
      isActive: true,
    },
  });

  console.log('Seed done:', { admin: admin.email, user: user.email, services: [netflix.name, spotify.name] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
