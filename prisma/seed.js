const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data with exact Person/Transaction/Repayment/EMI/EMI_Payment schema...');

  await prisma.eMI_Payment.deleteMany({});
  await prisma.eMI.deleteMany({});
  await prisma.repayment.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.person.deleteMany({});

  // 1. Create People (matching high-aesthetic design portraits)
  const maya = await prisma.person.create({
    data: {
      name: 'Maya Chen',
      email: 'maya.chen@example.com',
      phone: '+91 98765 43210',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBGtzgdREKk7fsgBdzXto-v9m9AzSYVNgvz8J6D0Nlrtieb0iEBuK-G-V3c7IOSdSNhY_6O2n8jVA5K5FY_oaXv07b1yTdKAtNYtIePm2zJmWl0o6VlvELtqZ1CHof82ZV95ETANy3kwswXV9GJCbwwHJDmKQQYJL_7MI8OVHOQOOMr1F1y9gfbAjZGypAY_iVKX-pzUWHGmo8glfjiB1kbSFMbuPF2rtcUs3kefuxlL32R6eh2ic-W',
      notes: 'Colleague & weekend photography buddy',
    },
  });

  const liam = await prisma.person.create({
    data: {
      name: 'Liam Vance',
      email: 'liam.vance@example.com',
      phone: '+91 98111 22334',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAOvkbSCJIEJldV5TYdQZoFPbQIXL6Auua-2FR68NZHHNEa9xqO0-gsnrH9ZqW9QKPwlMBUFwz_k7vJrLZIbFdmTyvVDoyVxmKLi510yFtY8lJ8HT5ENxYQQl_0Eekrp-8f2SfDosNLLnEVrAgd9KuFPZJsjldW2roF5IRZ-CEP1xTYFZxlT30lzzSbPhqN4gccpo-utUmHi2AYgKhRswZkQ3YAocvHhYxa32XOPukbExv3Te7PuBPD',
      notes: 'Concert & events splits',
    },
  });

  const aarav = await prisma.person.create({
    data: {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+91 99201 55432',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBGtzgdREKk7fsgBdzXto-v9m9AzSYVNgvz8J6D0Nlrtieb0iEBuK-G-V3c7IOSdSNhY_6O2n8jVA5K5FY_oaXv07b1yTdKAtNYtIePm2zJmWl0o6VlvELtqZ1CHof82ZV95ETANy3kwswXV9GJCbwwHJDmKQQYJL_7MI8OVHOQOOMr1F1y9gfbAjZGypAY_iVKX-pzUWHGmo8glfjiB1kbSFMbuPF2rtcUs3kefuxlL32R6eh2ic-W',
      notes: 'Flatmate - Groceries & Utilities',
    },
  });

  const priya = await prisma.person.create({
    data: {
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      phone: '+91 97654 12389',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCt6zbkQdhZwaMIFgIuWtfiJiEGzUUOYvl6xf2aSx7Y9MbU2IqpSr1yqn8ulwpz-V99bfeB9TPOo0BgreCRYZq5r1jvqp8AdPOZFfNQ8S-Vc6nMtRQYmJT9cbw9lWbfaejD5SVqIX_dY-bWOnnFgM9mw6F3af2E6Y-38N3D0vYTlZyrUS-NHw7N6Z4Rr-LkXwglqiU-ElPgB1BiADrZmTKgVVJEhxEm2O4q-MIEpW8Pf6irdZigqKw4',
      notes: 'Trip splits & dining',
    },
  });

  const rohan = await prisma.person.create({
    data: {
      name: 'Rohan Gupta',
      email: 'rohan.gupta@example.com',
      phone: '+91 98234 56789',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAOvkbSCJIEJldV5TYdQZoFPbQIXL6Auua-2FR68NZHHNEa9xqO0-gsnrH9ZqW9QKPwlMBUFwz_k7vJrLZIbFdmTyvVDoyVxmKLi510yFtY8lJ8HT5ENxYQQl_0Eekrp-8f2SfDosNLLnEVrAgd9KuFPZJsjldW2roF5IRZ-CEP1xTYFZxlT30lzzSbPhqN4gccpo-utUmHi2AYgKhRswZkQ3YAocvHhYxa32XOPukbExv3Te7PuBPD',
      notes: 'Badminton club',
    },
  });

  const ananya = await prisma.person.create({
    data: {
      name: 'Ananya Verma',
      email: 'ananya.v@example.com',
      phone: '+91 91234 56780',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCt6zbkQdhZwaMIFgIuWtfiJiEGzUUOYvl6xf2aSx7Y9MbU2IqpSr1yqn8ulwpz-V99bfeB9TPOo0BgreCRYZq5r1jvqp8AdPOZFfNQ8S-Vc6nMtRQYmJT9cbw9lWbfaejD5SVqIX_dY-bWOnnFgM9mw6F3af2E6Y-38N3D0vYTlZyrUS-NHw7N6Z4Rr-LkXwglqiU-ElPgB1BiADrZmTKgVVJEhxEm2O4q-MIEpW8Pf6irdZigqKw4',
      notes: 'Weekend co-working splits',
    },
  });

  // 2. Create Transactions (LENT: you paid, BORROWED: friend paid)
  // Maya Chen
  const t1 = await prisma.transaction.create({
    data: {
      personId: maya.id,
      description: 'Goa photoshoot - Sony A7 IV Camera rental',
      amount: 18500,
      type: 'LENT',
      status: 'PENDING',
      category: 'Photography & Gear',
      date: new Date('2026-08-22'),
    },
  });

  const t2 = await prisma.transaction.create({
    data: {
      personId: maya.id,
      description: 'Artisan Cafe breakfast & specialty coffee',
      amount: 1250,
      type: 'LENT',
      status: 'PENDING',
      category: 'Food & Dining',
      date: new Date('2026-08-28'),
    },
  });

  // Liam Vance
  await prisma.transaction.create({
    data: {
      personId: liam.id,
      description: 'Coldplay India Music of the Spheres Tour passes',
      amount: 12500,
      type: 'LENT',
      status: 'PENDING',
      category: 'Entertainment',
      date: new Date('2026-08-18'),
    },
  });

  // Aarav Sharma
  await prisma.transaction.create({
    data: {
      personId: aarav.id,
      description: 'ACT FiberNet Gigabit WiFi & Electricity Bill (Aug)',
      amount: 3200,
      type: 'BORROWED',
      status: 'PENDING',
      category: 'Utilities',
      date: new Date('2026-08-25'),
    },
  });

  // Priya Patel
  await prisma.transaction.create({
    data: {
      personId: priya.id,
      description: 'Uber XL Outstation ride to Lonavala retreat',
      amount: 4600,
      type: 'BORROWED',
      status: 'PENDING',
      category: 'Travel',
      date: new Date('2026-08-30'),
    },
  });

  // Rohan Gupta
  await prisma.transaction.create({
    data: {
      personId: rohan.id,
      description: 'Yonex shuttlecocks box & court booking slot',
      amount: 1800,
      type: 'LENT',
      status: 'PENDING',
      category: 'Sports',
      date: new Date('2026-08-15'),
    },
  });

  // Ananya Verma (Settled example)
  const tSettled = await prisma.transaction.create({
    data: {
      personId: ananya.id,
      description: 'WeWork day pass & coffee bar',
      amount: 1100,
      type: 'LENT',
      status: 'SETTLED',
      category: 'Work',
      date: new Date('2026-08-10'),
    },
  });

  await prisma.repayment.create({
    data: {
      personId: ananya.id,
      transactionId: tSettled.id,
      amount: 1100,
      notes: 'UPI payment via GPay',
      date: new Date('2026-08-11'),
    },
  });

  // 3. Create EMIs & EMI Payments
  const homeLoan = await prisma.eMI.create({
    data: {
      title: 'HDFC Home Loan',
      lender: 'HDFC Bank',
      principalAmount: 4500000,
      annualInterestRate: 8.5,
      tenureMonths: 240,
      startDate: new Date('2024-01-05'),
      monthlyEMI: 39053,
      autoDebitDay: 5,
      category: 'Home',
      status: 'ACTIVE',
    },
  });

  const carLoan = await prisma.eMI.create({
    data: {
      title: 'EV Auto Loan (Tata Nexon EV)',
      lender: 'SBI',
      principalAmount: 1200000,
      annualInterestRate: 8.9,
      tenureMonths: 60,
      startDate: new Date('2025-06-10'),
      monthlyEMI: 24860,
      autoDebitDay: 10,
      category: 'Auto',
      status: 'ACTIVE',
    },
  });

  await prisma.eMI_Payment.createMany({
    data: [
      {
        emiId: homeLoan.id,
        installmentNo: 32,
        amount: 39053,
        principalPart: 10250,
        interestPart: 28803,
        dueDate: new Date('2026-09-05'),
        status: 'UPCOMING',
      },
      {
        emiId: carLoan.id,
        installmentNo: 15,
        amount: 24860,
        principalPart: 16200,
        interestPart: 8660,
        dueDate: new Date('2026-09-10'),
        status: 'UPCOMING',
      },
      {
        emiId: homeLoan.id,
        installmentNo: 31,
        amount: 39053,
        principalPart: 10180,
        interestPart: 28873,
        dueDate: new Date('2026-08-05'),
        paidDate: new Date('2026-08-05'),
        status: 'PAID',
      },
    ],
  });

  console.log('Seeder completed successfully with exact schema!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
