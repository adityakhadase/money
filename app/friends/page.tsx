'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  MailCheck,
  Plus,
  Receipt,
  X,
  Send,
  Sparkles,
  Phone,
  Mail,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import confetti from 'canvas-confetti';
import InitialAvatar from '@/components/InitialAvatar';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  category: string;
  date: string;
  repayments: Array<{ id: string; amount: number; date: string }>;
}

interface Person {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  avatarUrl: string | null;
  notes: string | null;
  theyOweYou: number;
  youOweThem: number;
  netBalance: number;
  status: 'owes-you' | 'you-owe' | 'settled';
  transactions: Transaction[];
  repayments: Array<{ id: string; amount: number; date: string; notes: string | null }>;
}

export default function FriendsLedgerPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [summary, setSummary] = useState({
    totalTheyOweYou: 0,
    totalYouOweThem: 0,
    netPeerBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'owes-you' | 'you-owe' | 'settled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Toast State
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // Add Friend Form State
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendPhone, setNewFriendPhone] = useState('');
  const [newFriendWhatsapp, setNewFriendWhatsapp] = useState('');
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [newFriendNotes, setNewFriendNotes] = useState('');

  // Add Expense Form State
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseType, setExpenseType] = useState<'LENT' | 'BORROWED'>('LENT');
  const [expenseCategory, setExpenseCategory] = useState('Food & Dining');

  // Settle Form State
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/friends');
      const data = await res.json();
      if (data.people) {
        setPeople(data.people);
        setSummary(data.summary);
        if (!selectedPersonId && data.people.length > 0) {
          setSelectedPersonId(data.people[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleRemindFriend = async (person: Person) => {
    try {
      setIsSendingReminder(true);
      const res = await fetch('/api/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: person.id,
          channels: ['email', 'whatsapp'],
          customNote: person.notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast(`Reminder sent to ${person.name} via Email (Resend) & WhatsApp (Twilio)!`);
      } else {
        triggerToast(data.message || data.error || 'Could not send reminder');
      }
    } catch (err) {
      console.error(err);
      triggerToast(`Failed to dispatch reminder to ${person.name}`);
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;

    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFriendName,
          phone: newFriendPhone,
          whatsapp_number: newFriendWhatsapp || newFriendPhone,
          email: newFriendEmail,
          notes: newFriendNotes,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setIsAddFriendOpen(false);
        setNewFriendName('');
        setNewFriendPhone('');
        setNewFriendWhatsapp('');
        setNewFriendEmail('');
        setNewFriendNotes('');
        await fetchPeople();
        setSelectedPersonId(created.id);
        triggerToast(`Added ${created.name} to your friends ledger!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !expenseDesc.trim() || !expenseAmount) return;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: selectedPersonId,
          description: expenseDesc,
          amount: parseFloat(expenseAmount),
          type: expenseType,
          category: expenseCategory,
        }),
      });

      if (res.ok) {
        setIsAddExpenseOpen(false);
        setExpenseDesc('');
        setExpenseAmount('');
        await fetchPeople();
        triggerToast('Split transaction recorded successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettleUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !settleAmount) return;

    try {
      const res = await fetch('/api/repayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: selectedPersonId,
          amount: parseFloat(settleAmount),
          notes: settleNotes || 'Manual ledger settlement',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSettleModalOpen(false);
        setSettleAmount('');
        setSettleNotes('');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        await fetchPeople();
        if (data.remainingBalance && Math.abs(data.remainingBalance) > 0.001) {
          triggerToast(
            `Partial settlement saved! Remaining balance: ${formatINR(Math.abs(data.remainingBalance))}`
          );
        } else {
          triggerToast('Settlement saved & confirmation email receipt sent!');
        }
      } else {
        triggerToast(data.error || 'Failed to record settlement');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to record settlement');
    }
  };

  const handleDeleteTransaction = async (txId: string, desc: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the transaction "${desc}"?\n\nThis will recalculate balances and permanently remove related records.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/transactions?id=${txId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        triggerToast('Transaction deleted successfully!');
        await fetchPeople();
      } else {
        triggerToast(data.error || 'Failed to delete transaction');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error deleting transaction');
    }
  };

  const handleDeleteFriend = async (person: Person) => {
    if (person.netBalance !== 0) {
      triggerToast(
        `Cannot delete ${person.name} with unsettled balance of ${formatINR(Math.abs(person.netBalance))}. Please settle first.`
      );
      return;
    }

    const hasUnsettled = person.transactions?.some((t) => t.status !== 'SETTLED');
    if (hasUnsettled) {
      triggerToast(
        `Cannot delete ${person.name} because they have pending transactions. Please settle or remove them first.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${person.name} from your friends ledger?\n\nThis will remove the contact from your ledger.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/friends?id=${person.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        triggerToast(`Friend ${person.name} deleted successfully!`);
        setSelectedPersonId(null);
        await fetchPeople();
      } else {
        triggerToast(data.error || 'Failed to delete friend');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error deleting friend');
    }
  };

  // Filter & Search Logic
  const filteredPeople = people.filter((p) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'owes-you'
        ? p.status === 'owes-you'
        : filter === 'you-owe'
        ? p.status === 'you-owe'
        : p.status === 'settled';

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.phone && p.phone.includes(searchQuery)) ||
      (p.whatsapp_number && p.whatsapp_number.includes(searchQuery));

    return matchesFilter && matchesSearch;
  });

  const selectedPerson = people.find((p) => p.id === selectedPersonId) || people[0];

  return (
    <div className="flex flex-col w-full pb-16 pt-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-outline/20">
          <MailCheck className="w-5 h-5 text-secondary-fixed flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Live Peer Ledger
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Friends Ledger
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Track who owes you and who you owe with zero reconciliation friction.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddFriendOpen(true)}
            type="button"
            className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Friend</span>
          </button>
          {selectedPerson && (
            <button
              onClick={() => {
                setSettleAmount(
                  selectedPerson.netBalance !== 0
                    ? Math.abs(selectedPerson.netBalance).toString()
                    : ''
                );
                setIsSettleModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center justify-center gap-2 bg-surface-container text-on-surface hover:bg-surface-container-high px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Settle Balance</span>
            </button>
          )}
        </div>
      </section>

      {/* Financial Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/30">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              They Owe You
            </p>
            <p className="text-2xl font-bold text-secondary mt-1 tabular-nums">
              +{formatINR(summary.totalTheyOweYou)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary-container/40 flex items-center justify-center text-on-secondary-container">
            <ArrowUpRight className="w-6 h-6 text-secondary" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/30">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              You Owe Them
            </p>
            <p className="text-2xl font-bold text-tertiary mt-1 tabular-nums">
              -{formatINR(summary.totalYouOweThem)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-error-container/40 flex items-center justify-center text-on-error-container">
            <ArrowDownLeft className="w-6 h-6 text-tertiary" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/30">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Net Peer Balance
            </p>
            <p
              className={`text-2xl font-bold mt-1 tabular-nums ${
                summary.netPeerBalance >= 0 ? 'text-primary' : 'text-tertiary'
              }`}
            >
              {summary.netPeerBalance >= 0
                ? `+${formatINR(summary.netPeerBalance)}`
                : `-${formatINR(Math.abs(summary.netPeerBalance))}`}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </div>
      </section>

      {/* Search & Filter Controls */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-surface-container-high/30">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 pointer-events-none" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low text-on-surface placeholder:text-outline text-sm rounded-xl outline-none focus:bg-surface-container focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friend by name, phone or email..."
            type="text"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'all', label: `All Friends (${people.length})` },
            {
              key: 'owes-you',
              label: `Owes You (${people.filter((p) => p.status === 'owes-you').length})`,
            },
            {
              key: 'you-owe',
              label: `You Owe (${people.filter((p) => p.status === 'you-owe').length})`,
            },
            {
              key: 'settled',
              label: `Settled (${people.filter((p) => p.status === 'settled').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Master-Detail Ledger Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDE: Friends List (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">
              Loading ledger contacts...
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="p-8 bg-surface-container-lowest rounded-2xl text-center text-on-surface-variant text-sm border border-surface-container-high/30">
              No friends found matching your criteria.
            </div>
          ) : (
            filteredPeople.map((person) => {
              const isSelected = selectedPerson?.id === person.id;
              const net = person.netBalance;

              return (
                <div
                  key={person.id}
                  onClick={() => setSelectedPersonId(person.id)}
                  className={`cursor-pointer p-4 rounded-2xl shadow-sm transition-all duration-150 flex items-center justify-between border ${
                    isSelected
                      ? 'bg-surface-container-lowest ring-2 ring-primary border-primary/50'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low border-surface-container-high/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <InitialAvatar
                      name={person.name}
                      size="lg"
                      indicatorColor={
                        net > 0
                          ? 'bg-secondary'
                          : net < 0
                          ? 'bg-tertiary'
                          : 'bg-outline-variant'
                      }
                    />
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-on-surface truncate">
                        {person.name}
                      </h2>
                      <p className="text-xs text-on-surface-variant truncate">
                        {person.notes || `${person.transactions.length} splits logged`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2">
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
                        : '₹0.00'}
                    </span>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        net > 0
                          ? 'text-secondary'
                          : net < 0
                          ? 'text-tertiary'
                          : 'text-outline'
                      }`}
                    >
                      {net > 0 ? 'Owes You' : net < 0 ? 'You Owe' : 'Settled'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT SIDE: Friend Detail & Transaction History (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedPerson ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high/30 space-y-6">
              {/* Profile Card Top */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-container-high/40">
                <div className="flex items-center gap-4">
                  <InitialAvatar
                    name={selectedPerson.name}
                    size="xl"
                    className="w-14 h-14 text-xl ring-2 ring-primary/20"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-on-surface">
                      {selectedPerson.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-0.5">
                      {selectedPerson.whatsapp_number && (
                        <span className="flex items-center gap-1 text-secondary font-medium">
                          <MessageSquare className="w-3 h-3 text-secondary" /> {selectedPerson.whatsapp_number}
                        </span>
                      )}
                      {selectedPerson.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-outline" /> {selectedPerson.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remind / Add Action */}
                <div className="flex items-center gap-2">
                  {selectedPerson.netBalance > 0 && (
                    <button
                      type="button"
                      disabled={isSendingReminder}
                      onClick={() => handleRemindFriend(selectedPerson)}
                      className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingReminder ? 'Sending...' : 'Remind Friend'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Split New</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFriend(selectedPerson)}
                    className="inline-flex items-center gap-1 p-2 rounded-xl text-xs font-bold text-on-surface-variant hover:text-tertiary hover:bg-error-container/30 transition-all"
                    title={`Delete ${selectedPerson.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete Friend</span>
                  </button>
                </div>
              </div>

              {/* Balance Summary Header for Selected Friend */}
              <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Total Outstanding with {selectedPerson.name.split(' ')[0]}
                  </p>
                  <p
                    className={`text-2xl font-extrabold mt-0.5 tabular-nums ${
                      selectedPerson.netBalance > 0
                        ? 'text-secondary'
                        : selectedPerson.netBalance < 0
                        ? 'text-tertiary'
                        : 'text-on-surface'
                    }`}
                  >
                    {selectedPerson.netBalance > 0
                      ? `+${formatINR(selectedPerson.netBalance)}`
                      : selectedPerson.netBalance < 0
                      ? `-${formatINR(Math.abs(selectedPerson.netBalance))}`
                      : '₹0.00 (All Clear)'}
                  </p>
                </div>

                {selectedPerson.netBalance !== 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettleAmount(Math.abs(selectedPerson.netBalance).toString());
                      setIsSettleModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-surface-container-lowest text-xs font-bold text-on-surface hover:bg-surface-container shadow-xs transition-colors"
                  >
                    Mark as Settled
                  </button>
                )}
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <span>Itemized History ({selectedPerson.transactions.length})</span>
                </h3>

                {selectedPerson.transactions.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-6 text-center">
                    No transactions recorded with {selectedPerson.name} yet.
                  </p>
                ) : (
                  <div className="divide-y divide-surface-container-high/30">
                    {selectedPerson.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="py-3 flex items-center justify-between hover:bg-surface-container-low/40 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
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
                            <p className="text-sm font-bold text-on-surface">
                              {tx.description}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {new Date(tx.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              &middot; {tx.category}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`text-sm font-bold tabular-nums ${
                                tx.type === 'LENT' ? 'text-secondary' : 'text-tertiary'
                              }`}
                            >
                              {tx.type === 'LENT' ? '+' : '-'}
                              {formatINR(tx.amount)}
                            </span>
                            <p className="text-[10px] text-on-surface-variant font-medium">
                              {tx.status === 'SETTLED' ? (
                                <span className="text-secondary">Settled</span>
                              ) : tx.status === 'PARTIALLY_PAID' ? (
                                <span className="text-primary font-semibold">
                                  Partially Paid (
                                  {formatINR(
                                    Math.max(
                                      0,
                                      tx.amount -
                                        (tx.repayments?.reduce(
                                          (sum, r) => sum + r.amount,
                                          0
                                        ) || 0)
                                    )
                                  )}{' '}
                                  left)
                                </span>
                              ) : (
                                'Pending'
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteTransaction(tx.id, tx.description)
                            }
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-tertiary hover:bg-error-container/30 transition-all opacity-60 hover:opacity-100 cursor-pointer"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center text-on-surface-variant border border-surface-container-high/30">
              Select a friend to view their ledger and transaction history.
            </div>
          )}
        </div>
      </div>

      {/* Add Friend Modal */}
      {isAddFriendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-surface-container-high/50">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/40">
              <h3 className="text-base font-bold text-on-surface">Add New Friend</h3>
              <button
                onClick={() => setIsAddFriendOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFriend} className="space-y-4 mt-4">
              {/* Profile Starting Letter Preview */}
              <div className="flex flex-col items-center justify-center py-3 text-center bg-surface-container-low/50 rounded-2xl border border-surface-container-high/30">
                <InitialAvatar
                  name={newFriendName.trim() || '?'}
                  size="xl"
                  className="w-16 h-16 text-2xl shadow-sm ring-4 ring-primary/10"
                />
                <span className="text-xs font-semibold text-on-surface-variant mt-2">
                  {newFriendName.trim()
                    ? `Profile Initial: ${newFriendName.trim()[0].toUpperCase()}`
                    : 'Profile letter will appear as you type name'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newFriendPhone}
                    onChange={(e) => setNewFriendPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={newFriendWhatsapp}
                    onChange={(e) => setNewFriendWhatsapp(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Email Address (for Email Reminders)
                </label>
                <input
                  type="email"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                  placeholder="vikram@example.com"
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Relationship / Note
                </label>
                <input
                  type="text"
                  value={newFriendNotes}
                  onChange={(e) => setNewFriendNotes(e.target.value)}
                  placeholder="e.g. Badminton buddy, College friend"
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddFriendOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary text-on-primary hover:bg-primary-container rounded-xl shadow-xs"
                >
                  Save Friend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Split Expense Modal */}
      {isAddExpenseOpen && selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-surface-container-high/50">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/40">
              <h3 className="text-base font-bold text-on-surface">
                Split with {selectedPerson.name}
              </h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="e.g. Dinner at Bastian, Movie tickets"
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Amount in ₹ (INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="₹ 1,500.00"
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Who Paid?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseType('LENT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      expenseType === 'LENT'
                        ? 'bg-secondary-container/60 text-on-secondary-container border-secondary'
                        : 'bg-surface-container-low text-on-surface-variant border-transparent'
                    }`}
                  >
                    You Paid (They Owe)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseType('BORROWED')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      expenseType === 'BORROWED'
                        ? 'bg-error-container/60 text-on-error-container border-tertiary'
                        : 'bg-surface-container-low text-on-surface-variant border-transparent'
                    }`}
                  >
                    They Paid (You Owe)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Category
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Travel">Travel & Outstation</option>
                  <option value="Entertainment">Entertainment & Movies</option>
                  <option value="Utilities">Utilities & Rent</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary text-on-primary hover:bg-primary-container rounded-xl shadow-xs"
                >
                  Record Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      {isSettleModalOpen && selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-surface-container-high/50">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/40">
              <h3 className="text-base font-bold text-on-surface">
                Settle Balance with {selectedPerson.name}
              </h3>
              <button
                onClick={() => setIsSettleModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleUp} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Settlement Amount in ₹ (INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Payment Method / Note
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. GPay UPI Transfer / Cash"
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-secondary text-on-secondary hover:bg-secondary/90 rounded-xl shadow-xs"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
