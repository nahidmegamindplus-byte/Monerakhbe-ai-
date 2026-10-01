const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sync() {
  const token = '8395452549:AAFPbI_hGt6jmr9NpICtH_tXnTp1MxRIel8';
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json());
  if (res.ok) {
    const username = res.result.username;
    await prisma.paymentMethodConfig.upsert({
      where: { code: 'system_telegram_bot' },
      create: {
        code: 'system_telegram_bot',
        name: 'Telegram Bot System Config',
        type: 'SYSTEM',
        accountNumber: token,
        instructions: username,
        isActive: true,
      },
      update: {
        accountNumber: token,
        instructions: username,
        isActive: true,
      },
    });

    const admin = await prisma.user.findFirst();
    if (admin) {
      await prisma.telegramConnection.upsert({
        where: { userId: admin.id },
        create: {
          userId: admin.id,
          username: username,
          isConnected: true,
          connectedAt: new Date(),
        },
        update: {
          username: username,
          isConnected: true,
          connectedAt: new Date(),
        },
      });
    }

    console.log('✅ Successfully synced system_telegram_bot & connected admin to @' + username);
  } else {
    console.error('Failed to getMe:', res);
  }
}

sync().finally(() => prisma.$disconnect());
