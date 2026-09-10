const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all demo data for clean user start...');

  await prisma.eMI_Payment.deleteMany({});
  await prisma.eMI.deleteMany({});
  await prisma.repayment.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.person.deleteMany({});

  console.log('Database cleared! All tables are empty and ready for real data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
