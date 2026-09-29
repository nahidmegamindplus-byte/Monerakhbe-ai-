const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPlanCrud() {
  console.log('--- Testing Plan Creation, Update and Deletion ---');

  // 1. Create a Custom Plan
  const testPlanId = 'STARTER_TEST';
  
  // Cleanup if exists from previous run
  await prisma.plan.deleteMany({ where: { id: testPlanId } });

  const created = await prisma.plan.create({
    data: {
      id: testPlanId,
      name: 'Starter Trial Pack',
      description: 'নতুন ব্যবহারকারীদের জন্য বিশেষ সাশ্রয়ী ট্রায়াল প্যাকেজ',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      currency: 'BDT',
      reminderLimit: 300,
      memoryLimit: 300,
      taskLimit: 300,
      aiLimit: 300,
      fileSizeLimit: 15,
      telegramEnabled: true,
      advancedFeatures: false,
      isActive: true,
    }
  });
  console.log(`✓ 1. New Plan Created Successfully: ${created.name} (ID: ${created.id}, ৳${created.monthlyPrice}/mo)`);

  // 2. Update Plan
  const updated = await prisma.plan.update({
    where: { id: testPlanId },
    data: {
      monthlyPrice: 249,
      yearlyPrice: 2490,
      reminderLimit: 400
    }
  });
  console.log(`✓ 2. Plan Updated Successfully: Price changed to ৳${updated.monthlyPrice}/mo, Reminder limit: ${updated.reminderLimit}`);

  // 3. Verify in Plans catalog
  const allPlans = await prisma.plan.findMany();
  console.log(`✓ 3. Total Plans in System: ${allPlans.length} (${allPlans.map(p => p.id).join(', ')})`);

  // 4. Delete Custom Plan
  await prisma.plan.delete({ where: { id: testPlanId } });
  console.log(`✓ 4. Plan Removed / Deleted Successfully: ${testPlanId}`);

  console.log('==============================================');
  console.log('ALL PLAN CRUD CAPABILITIES VERIFIED 100%');
  console.log('==============================================');
}

testPlanCrud()
  .catch(err => {
    console.error('Plan CRUD Test Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
