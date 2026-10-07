import prisma from '../src/server/prisma';
import { seedDatabase } from '../src/server/services/seed.service';

seedDatabase(prisma)
  .catch((e) => {
    console.error('Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
