const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  for (const u of users) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.role}`);
  }
  const conns = await prisma.telegramConnection.findMany();
  console.log('Total telegram connections:', conns.length);
  for (const c of conns) {
    console.log(`- TelegramUser: ${c.telegramUserId}, UserID: ${c.userId}, Connected: ${c.isConnected}, Username: ${c.username}`);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
