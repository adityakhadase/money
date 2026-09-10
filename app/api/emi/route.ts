import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const emis = await prisma.eMI.findMany({
      include: {
        payments: {
          orderBy: { installmentNo: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ emis });
  } catch (error) {
    console.error('Error fetching EMIs:', error);
    return NextResponse.json({ error: 'Failed to fetch EMIs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      lender,
      principalAmount,
      annualInterestRate,
      tenureMonths,
      category,
      autoDebitDay,
    } = body;

    if (!title || !lender || !principalAmount || !annualInterestRate || !tenureMonths) {
      return NextResponse.json(
        { error: 'Missing required loan parameters' },
        { status: 400 }
      );
    }

    const P = parseFloat(principalAmount);
    const annualR = parseFloat(annualInterestRate);
    const N = parseInt(tenureMonths);
    const r = annualR / 12 / 100;

    // Standard EMI formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
    const emiAmount =
      r > 0 ? (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1) : P / N;

    const newEmi = await prisma.eMI.create({
      data: {
        title: title.trim(),
        lender: lender.trim(),
        principalAmount: P,
        annualInterestRate: annualR,
        tenureMonths: N,
        startDate: new Date(),
        monthlyEMI: Math.round(emiAmount),
        autoDebitDay: autoDebitDay ? parseInt(autoDebitDay) : 5,
        category: category?.trim() || 'Personal',
        status: 'ACTIVE',
      },
    });

    // Generate sample installments
    const paymentsData = [];
    let remainingPrincipal = P;
    const now = new Date();

    for (let i = 1; i <= Math.min(12, N); i++) {
      const interestPart = remainingPrincipal * r;
      const principalPart = emiAmount - interestPart;
      remainingPrincipal = Math.max(0, remainingPrincipal - principalPart);

      const dueDate = new Date(now.getFullYear(), now.getMonth() + (i - 1), autoDebitDay || 5);

      paymentsData.push({
        emiId: newEmi.id,
        installmentNo: i,
        amount: Math.round(emiAmount),
        principalPart: Math.round(principalPart),
        interestPart: Math.round(interestPart),
        dueDate,
        status: i === 1 ? 'UPCOMING' : 'UPCOMING',
      });
    }

    await prisma.eMI_Payment.createMany({
      data: paymentsData,
    });

    return NextResponse.json(newEmi, { status: 201 });
  } catch (error) {
    console.error('Error creating EMI:', error);
    return NextResponse.json({ error: 'Failed to create EMI' }, { status: 500 });
  }
}
