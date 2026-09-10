'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, Wallet, Users, AlertCircle } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import confetti from 'canvas-confetti';
import InitialAvatar from '@/components/InitialAvatar';

interface Person {
  id: string;
  name: string;
  avatarUrl: string | null;
  theyOweYou: number;
  youOweThem: number;
  netBalance: number;
  status: 'owes-you' | 'you-owe' | 'settled';
}

export default function SettleUpPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/friends');
      const data = await res.json();
      if (data.people) {
        setPeople(data.people);
        const firstUnsettled = data.people.find((p: Person) => p.netBalance !== 0);
        if (firstUnsettled) {
          setSelectedPersonId(firstUnsettled.id);
          setAmount(Math.abs(firstUnsettled.netBalance).toString());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleSelectPerson = (id: string) => {
    setSelectedPersonId(id);
    const p = people.find((item) => item.id === id);
    if (p && p.netBalance !== 0) {
      setAmount(Math.abs(p.netBalance).toString());
    } else {
      setAmount('');
    }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !amount) return;

    try {
      const res = await fetch('/api/repayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: selectedPersonId,
          amount: parseFloat(amount),
          notes: notes || 'Bulk settle-up confirmation',
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setSuccessMsg('Ledger successfully balanced and confirmation email receipt sent!');
        setTimeout(() => setSuccessMsg(null), 5000);
        await fetchPeople();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unsettledPeople = people.filter((p) => p.netBalance !== 0);
  const selectedPerson = people.find((p) => p.id === selectedPersonId);

  return (
    <div className="flex flex-col w-full pb-16 pt-6 max-w-3xl mx-auto">
      {/* Header */}
      <section className="pb-6 border-b border-surface-container-high/60 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Reconciliation & Settlement
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
          Settle Up
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Record cash, UPI, or bank repayments to balance mutual ledgers.
        </p>
      </section>

      {successMsg && (
        <div className="my-6 p-4 rounded-2xl bg-secondary-container/50 border border-secondary text-on-secondary-container flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Settle Form Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm border border-surface-container-high/30 my-6 space-y-6">
        <form onSubmit={handleSettle} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-2">
              Select Friend to Settle
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unsettledPeople.length === 0 ? (
                <div className="col-span-2 p-6 rounded-xl bg-surface-container-low text-center text-sm text-on-surface-variant">
                  🎉 All friend ledgers are fully balanced and settled!
                </div>
              ) : (
                unsettledPeople.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPerson(p.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      selectedPersonId === p.id
                        ? 'bg-surface-container-high/40 border-primary ring-2 ring-primary/40'
                        : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <InitialAvatar name={p.name} size="md" />
                      <div>
                        <p className="text-sm font-bold text-on-surface">{p.name}</p>
                        <p
                          className={`text-xs font-semibold ${
                            p.netBalance > 0 ? 'text-secondary' : 'text-tertiary'
                          }`}
                        >
                          {p.netBalance > 0 ? 'Owes you' : 'You owe'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-bold tabular-nums ${
                        p.netBalance > 0 ? 'text-secondary' : 'text-tertiary'
                      }`}
                    >
                      {p.netBalance > 0 ? '+' : '-'}
                      {formatINR(Math.abs(p.netBalance))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedPerson && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Settlement Amount in ₹ (INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="₹ 0.00"
                  className="w-full px-4 py-2.5 text-lg font-bold bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Payment Method / Reference Note
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid via PhonePe UPI / Cash"
                  className="w-full px-3.5 py-2.5 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary-container shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Confirm Settlement with {selectedPerson.name}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
