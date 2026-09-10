import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian numbering system (e.g. ₹1,00,000.00 or ₹45,200)
 */
export function formatINR(amount: number, showDecimals: boolean = true): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

export function formatINRPlain(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absAmount);
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export interface PersonBalanceSummary {
  personId: string;
  theyOweYou: number; // positive total lent un-repaid
  youOweThem: number; // positive total borrowed un-repaid
  netBalance: number; // theyOweYou - youOweThem (>0 they owe you, <0 you owe them)
  status: 'owes-you' | 'you-owe' | 'settled';
}

export interface GlobalLedgerSummary {
  totalTheyOweYou: number;
  totalYouOweThem: number;
  netPeerBalance: number;
  personSummaries: Map<string, PersonBalanceSummary>;
}

/**
 * Single source of truth calculation function for person balances and global ledger totals.
 * Ensures Net Peer Balance is ALWAYS mathematically equal to totalTheyOweYou - totalYouOweThem.
 */
export function calculateLedgerBalances(
  people: Array<{
    id: string;
    transactions: Array<{
      id: string;
      amount: number;
      type: string; // 'LENT' | 'BORROWED'
      status: string; // 'PENDING' | 'PARTIALLY_PAID' | 'SETTLED'
      repayments?: Array<{ amount: number }>;
    }>;
    repayments?: Array<{ amount: number; transactionId?: string | null }>;
  }>
): GlobalLedgerSummary {
  let totalTheyOweYou = 0;
  let totalYouOweThem = 0;
  const personSummaries = new Map<string, PersonBalanceSummary>();

  people.forEach((person) => {
    let personLentPending = 0;
    let personBorrowedPending = 0;

    person.transactions.forEach((tx) => {
      // Calculate remaining unpaid balance for transaction
      const repaidAmount = tx.repayments
        ? tx.repayments.reduce((sum, r) => sum + r.amount, 0)
        : 0;
      const remainingAmount = Math.max(0, tx.amount - repaidAmount);

      if (tx.status !== 'SETTLED' && remainingAmount > 0) {
        if (tx.type === 'LENT') {
          personLentPending += remainingAmount;
        } else if (tx.type === 'BORROWED') {
          personBorrowedPending += remainingAmount;
        }
      }
    });

    const netPerson = personLentPending - personBorrowedPending;
    let status: 'owes-you' | 'you-owe' | 'settled' = 'settled';
    if (netPerson > 0.001) status = 'owes-you';
    else if (netPerson < -0.001) status = 'you-owe';

    personSummaries.set(person.id, {
      personId: person.id,
      theyOweYou: personLentPending,
      youOweThem: personBorrowedPending,
      netBalance: netPerson,
      status,
    });

    if (netPerson > 0) {
      totalTheyOweYou += netPerson;
    } else if (netPerson < 0) {
      totalYouOweThem += Math.abs(netPerson);
    }
  });

  const netPeerBalance = totalTheyOweYou - totalYouOweThem;

  return {
    totalTheyOweYou,
    totalYouOweThem,
    netPeerBalance,
    personSummaries,
  };
}
