import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLedgerBalances } from '@/lib/utils';
import { sendReminderEmail, sendReminderWhatsApp } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { personId, channels = ['email', 'whatsapp'], customNote } = body;

    if (!personId) {
      return NextResponse.json({ error: 'personId is required' }, { status: 400 });
    }

    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        transactions: {
          include: { repayments: true },
        },
      },
    });

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // Calculate balance
    const summary = calculateLedgerBalances([person]);
    const personSummary = summary.personSummaries.get(person.id);
    const amountOwed = personSummary?.netBalance || 0;

    if (amountOwed <= 0) {
      return NextResponse.json({
        success: false,
        message: `${person.name} does not currently owe any balance.`,
      });
    }

    const results: {
      email?: { success: boolean; messageId?: string; error?: string };
      whatsapp?: { success: boolean; sid?: string; error?: string };
    } = {};

    // Send Email if requested and available
    if (channels.includes('email') && person.email) {
      results.email = await sendReminderEmail({
        friendName: person.name,
        friendEmail: person.email,
        amountOwed,
        note: customNote || person.notes,
      });
    }

    // Send WhatsApp if requested and available
    const whatsappNum = person.whatsapp_number || person.phone;
    if (channels.includes('whatsapp') && whatsappNum) {
      results.whatsapp = await sendReminderWhatsApp({
        friendName: person.name,
        friendWhatsapp: whatsappNum,
        amountOwed,
        note: customNote || person.notes,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Reminder dispatched to ${person.name}`,
      details: results,
      amountOwed,
    });
  } catch (error: any) {
    console.error('Error sending friend reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reminder notification' },
      { status: 500 }
    );
  }
}
