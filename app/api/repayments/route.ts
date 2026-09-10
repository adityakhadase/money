import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLedgerBalances } from '@/lib/utils';
import {
  sendSettlementEmailConfirmations,
  sendSettlementWhatsAppConfirmations,
} from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { personId, transactionId, amount, notes } = body;

    if (!personId || !amount) {
      return NextResponse.json(
        { error: 'personId and amount are required' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);

    // 1. Create repayment record in SQLite
    const repayment = await prisma.repayment.create({
      data: {
        personId,
        transactionId: transactionId || null,
        amount: parsedAmount,
        notes: notes?.trim() || 'Settlement payment',
        date: new Date(),
      },
      include: {
        person: true,
      },
    });

    // 2. If tied to a specific transaction, check whether to mark it SETTLED
    if (transactionId) {
      const tx = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { repayments: true },
      });

      if (tx) {
        const totalRepaid = tx.repayments.reduce((sum, r) => sum + r.amount, 0);
        if (totalRepaid >= tx.amount) {
          await prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'SETTLED' },
          });
        } else {
          await prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'PARTIALLY_PAID' },
          });
        }
      }
    } else {
      // Settle pending transactions for this person
      const pendingTxs = await prisma.transaction.findMany({
        where: { personId, status: { not: 'SETTLED' } },
      });

      for (const tx of pendingTxs) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { status: 'SETTLED' },
        });
      }
    }

    // 3. Compute updated remaining balance for the person
    const updatedPerson = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        transactions: {
          include: { repayments: true },
        },
        repayments: true,
      },
    });

    let remainingBalance = 0;
    if (updatedPerson) {
      const summary = calculateLedgerBalances([updatedPerson]);
      remainingBalance = summary.personSummaries.get(personId)?.netBalance || 0;
    }

    // 4. Fetch user profile for email/whatsapp destinations
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: 'default_user' },
    });

    const myEmail = userProfile?.email || process.env.MY_EMAIL;
    const friendEmail = repayment.person.email;
    const friendWhatsapp = repayment.person.whatsapp_number || repayment.person.phone;
    const myWhatsapp = userProfile?.whatsapp_number || process.env.MY_WHATSAPP_NUMBER;

    // 5. Send Email Confirmations (Resend) - Non-blocking
    let emailResults = null;
    try {
      emailResults = await sendSettlementEmailConfirmations({
        friendName: repayment.person.name,
        friendEmail,
        myEmail,
        amountSettled: parsedAmount,
        settlementDate: repayment.date,
        remainingBalance,
        note: repayment.notes,
      });
    } catch (emailErr) {
      console.error('Non-blocking error dispatching settlement Email:', emailErr);
    }

    // 6. Send WhatsApp Confirmations (Twilio) - Non-blocking, isolated from email
    let whatsappResults = null;
    try {
      whatsappResults = await sendSettlementWhatsAppConfirmations({
        friendName: repayment.person.name,
        friendWhatsapp,
        myWhatsapp,
        amountSettled: parsedAmount,
        settlementDate: repayment.date,
        note: repayment.notes,
      });
    } catch (notifErr) {
      console.error('Non-blocking error dispatching settlement WhatsApp:', notifErr);
    }

    return NextResponse.json(
      {
        repayment,
        remainingBalance,
        notifications: {
          email: emailResults,
          whatsapp: whatsappResults,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error recording repayment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record repayment' },
      { status: 500 }
    );
  }
}
