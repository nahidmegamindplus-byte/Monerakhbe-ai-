const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@monerakhbe.ai' }
  });

  if (admin) {
    // Ensure password and role are active
    const passwordHash = await bcrypt.hash('Admin123456!', 10);
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        role: 'ADMIN',
        isSuspended: false
      }
    });
    console.log('Admin user updated and confirmed:');
    console.log('Email: admin@monerakhbe.ai');
    console.log('Password: Admin123456!');
    console.log('Role: ADMIN');
  } else {
    const passwordHash = await bcrypt.hash('Admin123456!', 10);
    await prisma.user.create({
      data: {
        name: 'MoneRakhbe Master Admin',
        email: 'admin@monerakhbe.ai',
        passwordHash,
        role: 'ADMIN',
        plan: 'BUSINESS',
        timezone: 'Asia/Dhaka',
        language: 'bn',
        isSuspended: false
      }
    });
    console.log('Admin user created successfully:');
    console.log('Email: admin@monerakhbe.ai');
    console.log('Password: Admin123456!');
    console.log('Role: ADMIN');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
