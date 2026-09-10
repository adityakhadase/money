import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, amount, type, category, personId, date } = body;

    if (!description || !amount || !type || !personId) {
      return NextResponse.json(
        { error: 'Description, amount, type, and personId are required' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        description: description.trim(),
        amount: parseFloat(amount),
        type, // 'LENT' or 'BORROWED'
        status: 'PENDING',
        category: category?.trim() || 'General',
        personId,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to record transaction' },
      { status: 500 }
    );
  }
}
