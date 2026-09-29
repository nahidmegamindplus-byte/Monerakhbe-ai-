const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.paymentMethodConfig.count();
  if (count === 0) {
    console.log('Seeding initial payment method configurations...');
    await prisma.paymentMethodConfig.createMany({
      data: [
        {
          code: 'bkash',
          name: 'বিকাশ (bKash)',
          type: 'WALLET',
          accountNumber: '01886123456',
          accountType: 'Personal',
          instructions: '১. আপনার বিকাশ অ্যাপ অথবা *২৪৭# ডায়াল করে "Send Money" অপশনে যান।\n২. উপরের বিকাশ নাম্বারে নির্ধারিত টাকা সেন্ড মানি করুন।\n৩. সফল লেনদেনের পর TrxID এবং প্রেরক নাম্বার নিচে দিয়ে ভেরিফাই করুন।',
          chargePercent: 0,
          isActive: true,
          displayOrder: 1,
        },
        {
          code: 'nagad',
          name: 'নগদ (Nagad)',
          type: 'WALLET',
          accountNumber: '01886123456',
          accountType: 'Personal',
          instructions: '১. আপনার নগদ অ্যাপ অথবা *১৬৭# ডায়াল করে "Send Money" অপশনে যান।\n২. উপরের নগদ নাম্বারে টাকা পাঠিয়ে দিন।\n৩. ফিরতি SMS থেকে Transaction ID (TrxID) নিচে দিন।',
          chargePercent: 0,
          isActive: true,
          displayOrder: 2,
        },
        {
          code: 'rocket',
          name: 'রকেট (Rocket)',
          type: 'WALLET',
          accountNumber: '01886123456',
          accountType: 'Personal',
          instructions: '১. রকেট অ্যাপ অথবা *৩২২# ডায়াল করে "Send Money" করুন।\n২. উপরের রকেট নাম্বারে টাকা পাঠান।\n৩. ট্রানজেকশন আইডি নিচে বসিয়ে সাবমিট করুন।',
          chargePercent: 0,
          isActive: true,
          displayOrder: 3,
        }
      ]
    });
    console.log('Initial payment methods seeded successfully.');
  } else {
    console.log(`Payment methods already exist (${count} methods).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
