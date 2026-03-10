import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('Admin created:', admin);
}

main();
