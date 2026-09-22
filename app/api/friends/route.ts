import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLedgerBalances } from '@/lib/utils';

export async function GET() {
  try {
    const people = await prisma.person.findMany({
      include: {
        transactions: {
          include: {
            repayments: true,
          },
          orderBy: { date: 'desc' },
        },
        repayments: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const summary = calculateLedgerBalances(people);

    const peopleWithBalances = people.map((person) => {
      const pSummary = summary.personSummaries.get(person.id);
      return {
        ...person,
        theyOweYou: pSummary?.theyOweYou || 0,
        youOweThem: pSummary?.youOweThem || 0,
        netBalance: pSummary?.netBalance || 0,
        status: pSummary?.status || 'settled',
      };
    });

    return NextResponse.json({
      people: peopleWithBalances,
      summary: {
        totalTheyOweYou: summary.totalTheyOweYou,
        totalYouOweThem: summary.totalYouOweThem,
        netPeerBalance: summary.netPeerBalance,
      },
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, whatsapp_number, avatarUrl, notes } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Person name is required' },
        { status: 400 }
      );
    }

    const newPerson = await prisma.person.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        whatsapp_number: whatsapp_number?.trim() || phone?.trim() || null,
        avatarUrl: null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(newPerson, { status: 201 });
  } catch (error) {
    console.error('Error creating friend:', error);
    return NextResponse.json(
      { error: 'Failed to add friend' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

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
        { error: 'Friend ID is required for deletion' },
        { status: 400 }
      );
    }

    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        transactions: {
          include: { repayments: true },
        },
        repayments: true,
      },
    });

    if (!person) {
      return NextResponse.json(
        { error: 'Friend not found' },
        { status: 404 }
      );
    }

    // Safety Check 1: Check whether friend has unsettled debts or pending dues
    const summary = calculateLedgerBalances([person]);
    const pSummary = summary.personSummaries.get(id);
    const netBalance = pSummary?.netBalance || 0;
    const hasUnsettledTxs = person.transactions.some(
      (tx) => tx.status !== 'SETTLED'
    );

    if (Math.abs(netBalance) > 0.001 || hasUnsettledTxs) {
      const formattedDue = Math.abs(netBalance).toFixed(2);
      return NextResponse.json(
        {
          error: `Cannot delete ${person.name} because they have pending dues or unsettled debts (₹${formattedDue} outstanding). Please settle all balances before deleting.`,
        },
        { status: 400 }
      );
    }

    // Safety Check 2: If they are fully settled or have no transactions, safely delete atomically
    await prisma.$transaction(async (prismaClient) => {
      // Clean up repayments
      if (person.repayments && person.repayments.length > 0) {
        await prismaClient.repayment.deleteMany({
          where: { personId: id },
        });
      }

      // Clean up settled transactions
      if (person.transactions && person.transactions.length > 0) {
        await prismaClient.transaction.deleteMany({
          where: { personId: id },
        });
      }

      // Delete the person
      await prismaClient.person.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Friend ${person.name} deleted successfully.`,
      deletedPersonId: id,
    });
  } catch (error: any) {
    console.error('Error deleting friend:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete friend' },
      { status: 500 }
    );
  }
}
