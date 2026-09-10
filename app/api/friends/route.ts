import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLedgerBalances } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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
