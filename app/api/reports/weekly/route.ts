import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLedgerBalances } from '@/lib/utils';
import { sendWeeklySummaryEmail } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Optional CRON_SECRET security for Vercel Cron
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && cronSecret.trim() !== '') {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 1. Get User Profile email or environment fallback
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: 'default_user' },
    });
    const recipientEmail = userProfile?.email || process.env.MY_EMAIL;

    if (!recipientEmail) {
      return NextResponse.json(
        {
          error:
            'No recipient email found. Please set MY_EMAIL in .env or configure UserProfile email.',
        },
        { status: 400 }
      );
    }

    // 2. Compute Ledger Balances
    const people = await prisma.person.findMany({
      include: {
        transactions: {
          include: { repayments: true },
        },
        repayments: true,
      },
    });

    const summary = calculateLedgerBalances(people);

    // 3. Find EMIs due in the coming 7 days
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingPayments = await prisma.eMI_Payment.findMany({
      where: {
        status: 'UPCOMING',
        dueDate: {
          gte: now,
          lte: in7Days,
        },
      },
      include: { emi: true },
      orderBy: { dueDate: 'asc' },
    });

    const upcomingEMIs = upcomingPayments.map((p) => ({
      title: p.emi.title,
      lender: p.emi.lender,
      amount: p.amount,
      dueDate: p.dueDate,
      installmentNo: p.installmentNo,
    }));

    // 4. Find Settlements from the past 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const pastSettlements = await prisma.repayment.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
        },
      },
      include: { person: true },
      orderBy: { date: 'desc' },
    });

    const recentSettlements = pastSettlements.map((s) => ({
      friendName: s.person.name,
      amount: s.amount,
      date: s.date,
      notes: s.notes,
    }));

    // 5. Send the weekly email via Resend
    const result = await sendWeeklySummaryEmail({
      recipientEmail,
      totalReceivables: summary.totalTheyOweYou,
      totalPayables: summary.totalYouOweThem,
      netBalance: summary.netPeerBalance,
      upcomingEMIs,
      recentSettlements,
    });

    return NextResponse.json({
      success: true,
      message: `Weekly report generated and sent to ${recipientEmail}`,
      report: {
        recipientEmail,
        totalReceivables: summary.totalTheyOweYou,
        totalPayables: summary.totalYouOweThem,
        netBalance: summary.netPeerBalance,
        upcomingEMIsCount: upcomingEMIs.length,
        past7DaysSettlementsCount: recentSettlements.length,
      },
      emailDelivery: result,
    });
  } catch (error: any) {
    console.error('Error generating weekly report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate weekly report' },
      { status: 500 }
    );
  }
}
