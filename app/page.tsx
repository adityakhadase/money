import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR, calculateLedgerBalances } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  Calendar,
  CreditCard,
  Users,
  ChevronRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import InitialAvatar from '@/components/InitialAvatar';

export const revalidate = 0; // Dynamic server render

export default async function DashboardPage() {
  // Fetch People data with Transactions and Repayments
  const people = await prisma.person.findMany({
    include: {
      transactions: {
        include: {
          repayments: true,
        },
      },
      repayments: true,
    },
  });

  // Calculate centralized balances using shared source of truth
  const { totalTheyOweYou, totalYouOweThem, netPeerBalance, personSummaries } =
    calculateLedgerBalances(people);

  // Fetch EMIs & upcoming EMI payments
  const emis = await prisma.eMI.findMany({
    include: {
      payments: {
        where: { status: 'UPCOMING' },
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  const totalActiveEMIs = emis.filter((e) => e.status === 'ACTIVE').length;
  const totalMonthlyEMI = emis.reduce((acc, curr) => acc + curr.monthlyEMI, 0);

  // Collect upcoming payments
  const upcomingPayments = await prisma.eMI_Payment.findMany({
    where: { status: 'UPCOMING' },
    include: { emi: true },
    orderBy: { dueDate: 'asc' },
    take: 3,
  });

  // Recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    include: { person: true },
    orderBy: { date: 'desc' },
    take: 4,
  });

  // Find top debtor for smart tip if any
  const topDebtor = people.find((p) => {
    const summary = personSummaries.get(p.id);
    return summary && summary.netBalance > 0;
  });
  const topDebtorBalance = topDebtor ? personSummaries.get(topDebtor.id)?.netBalance || 0 : 0;

  return (
    <div className="flex flex-col w-full pb-12 pt-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Financial Overview &middot; Single User
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Consolidated overview of peer ledger, loans, and upcoming EMIs in ₹ INR.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/friends"
            className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Split Expense</span>
          </Link>
          <Link
            href="/emi"
            className="inline-flex items-center justify-center gap-2 bg-surface-container text-on-surface hover:bg-surface-container-high px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Manage EMIs</span>
          </Link>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        {/* Net Peer Balance */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/30">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Net Peer Balance
            </p>
            <p
              className={`text-2xl font-bold mt-1 tabular-nums ${
                netPeerBalance >= 0 ? 'text-secondary' : 'text-tertiary'
              }`}
            >
              {netPeerBalance >= 0
                ? `+${formatINR(netPeerBalance)}`
                : `-${formatINR(Math.abs(netPeerBalance))}`}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Across {people.length} active contacts
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* They Owe You */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/30">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Friends Owe You
            </p>
            <p className="text-2xl font-bold text-secondary mt-1 tabular-nums">
              +{formatINR(totalTheyOweYou)}
            </p>
            <p className="text-xs text-secondary font-medium mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Receivables
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-container/40 flex items-center justify-center text-on-secondary-container">
            <ArrowUpRight className="w-6 h-6 text-secondary" />
          </div>
        </div>

        {/* Monthly EMI Total */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/30">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Monthly EMI Commitment
            </p>
            <p className="text-2xl font-bold text-on-surface mt-1 tabular-nums">
              {formatINR(totalMonthlyEMI)}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {totalActiveEMIs} Active Loans
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Friends Ledger Quick Glance */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high/30">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-on-surface">
                  Friends Ledger Highlights
                </h2>
              </div>
              <Link
                href="/friends"
                className="text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 transition-colors"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {people.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant text-sm">
                <p>No friends added yet.</p>
                <Link
                  href="/friends"
                  className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-bold text-primary hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add your first friend
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-surface-container-high/30 mt-2">
                {people.slice(0, 4).map((person) => {
                  const summary = personSummaries.get(person.id);
                  const net = summary ? summary.netBalance : 0;

                  return (
                    <div
                      key={person.id}
                      className="py-3.5 flex items-center justify-between hover:bg-surface-container-low/60 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <InitialAvatar name={person.name} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">
                            {person.name}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {person.notes || `${person.transactions.length} transactions`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            net > 0
                              ? 'text-secondary'
                              : net < 0
                              ? 'text-tertiary'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          {net > 0
                            ? `+${formatINR(net)}`
                            : net < 0
                            ? `-${formatINR(Math.abs(net))}`
                            : 'Settled'}
                        </span>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wide ${
                            net > 0
                              ? 'text-secondary'
                              : net < 0
                              ? 'text-tertiary'
                              : 'text-outline'
                          }`}
                        >
                          {net > 0
                            ? 'Owes You'
                            : net < 0
                            ? 'You Owe'
                            : 'All Clear'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Splits List */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high/30">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/40">
              <h2 className="text-base font-bold text-on-surface">
                Recent Activity
              </h2>
              <span className="text-xs text-on-surface-variant">Live Ledger</span>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant text-sm">
                No recent transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-3 mt-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          tx.type === 'LENT'
                            ? 'bg-secondary-container/50 text-secondary'
                            : 'bg-error-container/50 text-tertiary'
                        }`}
                      >
                        {tx.type === 'LENT' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {tx.description}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {tx.person.name} &middot; {tx.category}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-bold tabular-nums ${
                        tx.type === 'LENT' ? 'text-secondary' : 'text-tertiary'
                      }`}
                    >
                      {tx.type === 'LENT' ? '+' : '-'}
                      {formatINR(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Upcoming EMIs & Debt Overview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming EMI Payments */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high/30">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-on-surface">
                  Upcoming EMIs
                </h2>
              </div>
              <Link
                href="/emi"
                className="text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 transition-colors"
              >
                Schedule <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              {upcomingPayments.length === 0 ? (
                <div className="py-6 text-center text-on-surface-variant text-sm">
                  <p>No active loans or pending EMIs.</p>
                  <Link
                    href="/emi"
                    className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-bold text-primary hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add a loan to track EMIs
                  </Link>
                </div>
              ) : (
                upcomingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3.5 rounded-xl border border-surface-container bg-surface-container-lowest hover:border-primary/40 transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-md">
                          {payment.emi.lender}
                        </span>
                        <p className="text-sm font-bold text-on-surface">
                          {payment.emi.title}
                        </p>
                      </div>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-outline" /> Due:{' '}
                        {new Date(payment.dueDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-on-surface tabular-nums">
                        {formatINR(payment.amount)}
                      </p>
                      <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                        Inst. #{payment.installmentNo}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Smart Tip Card */}
          <div className="bg-primary/5 rounded-2xl p-5 border border-primary/15 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary text-on-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary">
                  Smart Peer Offset Suggestion
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {topDebtor && upcomingPayments.length > 0 ? (
                    <>
                      You have{' '}
                      <span className="font-semibold text-secondary">
                        +{formatINR(totalTheyOweYou)}
                      </span>{' '}
                      in pending receivables. Collecting from {topDebtor.name} (
                      {formatINR(topDebtorBalance)}) can help cover your next{' '}
                      {upcomingPayments[0].emi.title} EMI of{' '}
                      {formatINR(upcomingPayments[0].amount)}.
                    </>
                  ) : (
                    <>
                      Add your friends and loan obligations to receive automated cash flow offset suggestions and smart settlement reminders.
                    </>
                  )}
                </p>
                <Link
                  href="/friends"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-2.5"
                >
                  Manage ledger &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
