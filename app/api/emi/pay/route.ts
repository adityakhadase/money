import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    const updated = await prisma.eMI_Payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error marking EMI as paid:', error);
    return NextResponse.json({ error: 'Failed to update EMI payment' }, { status: 500 });
  }
}
