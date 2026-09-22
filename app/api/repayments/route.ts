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

    if (!personId || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'personId and amount are required' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Settlement amount must be a positive number greater than 0' },
        { status: 400 }
      );
    }

    // 1. Fetch person with transactions and repayments
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        transactions: {
          include: { repayments: true },
          orderBy: { date: 'asc' }, // FIFO: oldest debts settled first
        },
        repayments: true,
      },
    });

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    // 2. Validate settlement amount against outstanding balance
    if (transactionId) {
      // Settling a specific transaction
      const tx = person.transactions.find((t) => t.id === transactionId);
      if (!tx) {
        return NextResponse.json(
          { error: 'Transaction not found for this friend' },
          { status: 404 }
        );
      }

      const repaidSoFar = tx.repayments.reduce((sum, r) => sum + r.amount, 0);
      const remainingForTx = Math.max(0, tx.amount - repaidSoFar);

      if (remainingForTx <= 0.001 || tx.status === 'SETTLED') {
        return NextResponse.json(
          { error: 'This transaction is already fully settled' },
          { status: 400 }
        );
      }

      if (parsedAmount > remainingForTx + 0.001) {
        return NextResponse.json(
          {
            error: `Repayment amount (₹${parsedAmount}) cannot exceed remaining amount of ₹${remainingForTx.toFixed(2)}`,
          },
          { status: 400 }
        );
      }

      // Atomic execution for single transaction
      const settlementResult = await prisma.$transaction(async (prismaClient) => {
        const repayment = await prismaClient.repayment.create({
          data: {
            personId,
            transactionId: tx.id,
            amount: parsedAmount,
            notes: notes?.trim() || 'Settlement payment',
            date: new Date(),
          },
          include: { person: true },
        });

        const newTotalRepaid = repaidSoFar + parsedAmount;
        const isFullySettled = newTotalRepaid >= tx.amount - 0.001;

        await prismaClient.transaction.update({
          where: { id: tx.id },
          data: {
            status: isFullySettled ? 'SETTLED' : 'PARTIALLY_PAID',
          },
        });

        return repayment;
      });

      return await handlePostSettlementSuccess(personId, parsedAmount, settlementResult);
    } else {
      // General settlement for this person (from /settle or /friends)
      const currentSummary = calculateLedgerBalances([person]);
      const pSummary = currentSummary.personSummaries.get(personId);
      const netBalance = pSummary?.netBalance || 0; // > 0 friend owes you, < 0 you owe friend
      const totalOutstanding = Math.abs(netBalance);

      if (totalOutstanding <= 0.001) {
        return NextResponse.json(
          { error: 'Friend ledger is already fully balanced (₹0.00 remaining)' },
          { status: 400 }
        );
      }

      if (parsedAmount > totalOutstanding + 0.001) {
        return NextResponse.json(
          {
            error: `Repayment amount (₹${parsedAmount}) cannot exceed outstanding balance of ₹${totalOutstanding.toFixed(2)}`,
          },
          { status: 400 }
        );
      }

      // Determine candidate transactions to allocate payment across (FIFO)
      // If netBalance > 0: friend owes you -> settle 'LENT' transactions
      // If netBalance < 0: you owe friend -> settle 'BORROWED' transactions
      const targetType = netBalance > 0 ? 'LENT' : 'BORROWED';
      const candidateTxs = person.transactions.filter(
        (t) => t.type === targetType && t.status !== 'SETTLED'
      );

      // Atomic execution for allocating payment across transactions
      const settlementResult = await prisma.$transaction(async (prismaClient) => {
        let remainingToAllocate = parsedAmount;
        let primaryRepayment = null;

        for (const tx of candidateTxs) {
          if (remainingToAllocate <= 0.001) break;

          const txRepaid = tx.repayments.reduce((sum, r) => sum + r.amount, 0);
          const txRemaining = Math.max(0, tx.amount - txRepaid);

          if (txRemaining <= 0.001) continue;

          const allocation = Math.min(remainingToAllocate, txRemaining);
          const repayment = await prismaClient.repayment.create({
            data: {
              personId,
              transactionId: tx.id,
              amount: allocation,
              notes: notes?.trim() || 'Ledger settlement',
              date: new Date(),
            },
            include: { person: true },
          });

          if (!primaryRepayment) {
            primaryRepayment = repayment;
          }

          const newRepaid = txRepaid + allocation;
          const isFullySettled = newRepaid >= tx.amount - 0.001;

          await prismaClient.transaction.update({
            where: { id: tx.id },
            data: {
              status: isFullySettled ? 'SETTLED' : 'PARTIALLY_PAID',
            },
          });

          remainingToAllocate -= allocation;
        }

        // If any remaining amount could not be matched to transactions, record as unlinked repayment
        if (remainingToAllocate > 0.001) {
          const unlinkedRepayment = await prismaClient.repayment.create({
            data: {
              personId,
              transactionId: null,
              amount: remainingToAllocate,
              notes: notes?.trim() || 'General settlement balance',
              date: new Date(),
            },
            include: { person: true },
          });
          if (!primaryRepayment) {
            primaryRepayment = unlinkedRepayment;
          }
        }

        return primaryRepayment;
      });

      return await handlePostSettlementSuccess(personId, parsedAmount, settlementResult);
    }
  } catch (error: any) {
    console.error('Error recording repayment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record repayment' },
      { status: 500 }
    );
  }
}

// Helper to compute final balance and send non-blocking notifications
async function handlePostSettlementSuccess(
  personId: string,
  settledAmount: number,
  repaymentRecord: any
) {
  // Fetch updated person state with transactions and repayments
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

  // Fetch user profile for email/whatsapp destinations
  const userProfile = await prisma.userProfile.findUnique({
    where: { id: 'default_user' },
  });

  const myEmail = userProfile?.email || process.env.MY_EMAIL;
  const friendName = repaymentRecord?.person?.name || updatedPerson?.name || 'Friend';
  const friendEmail = repaymentRecord?.person?.email || updatedPerson?.email;
  const friendWhatsapp =
    repaymentRecord?.person?.whatsapp_number ||
    repaymentRecord?.person?.phone ||
    updatedPerson?.whatsapp_number ||
    updatedPerson?.phone;
  const myWhatsapp = userProfile?.whatsapp_number || process.env.MY_WHATSAPP_NUMBER;

  // Send Email Confirmations (Resend) - Non-blocking
  let emailResults = null;
  try {
    emailResults = await sendSettlementEmailConfirmations({
      friendName,
      friendEmail,
      myEmail,
      amountSettled: settledAmount,
      settlementDate: repaymentRecord?.date || new Date(),
      remainingBalance,
      note: repaymentRecord?.notes || 'Settlement payment',
    });
  } catch (emailErr) {
    console.error('Non-blocking error dispatching settlement Email:', emailErr);
  }

  // Send WhatsApp Confirmations (Twilio) - Non-blocking
  let whatsappResults = null;
  try {
    whatsappResults = await sendSettlementWhatsAppConfirmations({
      friendName,
      friendWhatsapp,
      myWhatsapp,
      amountSettled: settledAmount,
      settlementDate: repaymentRecord?.date || new Date(),
      note: repaymentRecord?.notes || 'Settlement payment',
    });
  } catch (notifErr) {
    console.error('Non-blocking error dispatching settlement WhatsApp:', notifErr);
  }

  return NextResponse.json(
    {
      repayment: repaymentRecord,
      remainingBalance,
      notifications: {
        email: emailResults,
        whatsapp: whatsappResults,
      },
    },
    { status: 201 }
  );
}
