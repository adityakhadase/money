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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    // Also support JSON body if query param not present
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (_) {
        // Body was empty or not JSON
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required for deletion' },
        { status: 400 }
      );
    }

    // Atomic transaction deletion and linked repayments cleanup
    const result = await prisma.$transaction(async (prismaClient) => {
      const existing = await prismaClient.transaction.findUnique({
        where: { id },
        include: { repayments: true },
      });

      if (!existing) {
        return null;
      }

      // Delete linked repayments so no orphaned repayments remain
      if (existing.repayments && existing.repayments.length > 0) {
        await prismaClient.repayment.deleteMany({
          where: { transactionId: id },
        });
      }

      // Delete transaction
      await prismaClient.transaction.delete({
        where: { id },
      });

      return existing;
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction and linked repayments deleted successfully',
      deletedTransactionId: id,
      personId: result.personId,
    });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
