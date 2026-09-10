'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingDown,
  Building,
  AlertCircle,
  X,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface EMIPayment {
  id: string;
  installmentNo: number;
  amount: number;
  principalPart: number;
  interestPart: number;
  dueDate: string;
  paidDate: string | null;
  status: 'PAID' | 'UPCOMING' | 'OVERDUE';
}

interface EMI {
  id: string;
  title: string;
  lender: string;
  principalAmount: number;
  annualInterestRate: number;
  tenureMonths: number;
  startDate: string;
  monthlyEMI: number;
  autoDebitDay: number;
  category: string;
  status: string;
  payments: EMIPayment[];
}

export default function EMITrackerPage() {
  const [emis, setEmis] = useState<EMI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmiId, setSelectedEmiId] = useState<string | null>(null);
  const [isAddEmiOpen, setIsAddEmiOpen] = useState(false);

  // New EMI Form State
  const [title, setTitle] = useState('');
  const [lender, setLender] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [annualInterestRate, setAnnualInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [category, setCategory] = useState('Personal');
  const [autoDebitDay, setAutoDebitDay] = useState('5');

  const fetchEMIs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/emi');
      const data = await res.json();
      if (data.emis) {
        setEmis(data.emis);
        if (!selectedEmiId && data.emis.length > 0) {
          setSelectedEmiId(data.emis[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load EMIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEMIs();
  }, []);

  const totalMonthlyObligation = emis.reduce((sum, e) => sum + e.monthlyEMI, 0);
  const totalOutstandingPrincipal = emis.reduce((sum, e) => sum + e.principalAmount, 0);

  const handleAddEMI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !lender || !principalAmount || !annualInterestRate || !tenureMonths) return;

    try {
      const res = await fetch('/api/emi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          lender,
          principalAmount: parseFloat(principalAmount),
          annualInterestRate: parseFloat(annualInterestRate),
          tenureMonths: parseInt(tenureMonths),
          category,
          autoDebitDay: parseInt(autoDebitDay),
        }),
      });

      if (res.ok) {
        setIsAddEmiOpen(false);
        setTitle('');
        setLender('');
        setPrincipalAmount('');
        setAnnualInterestRate('');
        setTenureMonths('');
        await fetchEMIs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayInstallment = async (paymentId: string) => {
    try {
      const res = await fetch('/api/emi/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });

      if (res.ok) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
        await fetchEMIs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedEmi = emis.find((e) => e.id === selectedEmiId) || emis[0];

  return (
    <div className="flex flex-col w-full pb-16 pt-6">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Debt & Loan Obligations
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            EMI Tracker & Schedule
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Track monthly bank debits, amortization schedules, and upcoming loan payments.
          </p>
        </div>

        <button
          onClick={() => setIsAddEmiOpen(true)}
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary-container px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Loan / EMI</span>
        </button>
      </section>

      {/* Summary KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/30">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Monthly EMI
            </p>
            <p className="text-2xl font-bold text-on-surface mt-1 tabular-nums">
              {formatINR(totalMonthlyObligation)}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Across {emis.length} active facilities
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/30">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Loan Principal
            </p>
            <p className="text-2xl font-bold text-on-surface mt-1 tabular-nums">
              {formatINR(totalOutstandingPrincipal)}
            </p>
            <p className="text-xs text-secondary font-semibold mt-0.5 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> All loans active
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface">
            <Building className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex items-center justify-between border border-surface-container-high/30">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Next Due Date
            </p>
            <p className="text-2xl font-bold text-primary mt-1 tabular-nums">
              5th of Every Month
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Auto-debit mandate active
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary-container/40 flex items-center justify-center text-on-secondary-container">
            <Calendar className="w-6 h-6 text-secondary" />
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Loan Facilities List */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-bold text-on-surface px-1">
            Active Facilities ({emis.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">
              Loading loan accounts...
            </div>
          ) : (
            emis.map((emi) => {
              const isSelected = selectedEmi?.id === emi.id;

              return (
                <div
                  key={emi.id}
                  onClick={() => setSelectedEmiId(emi.id)}
                  className={`cursor-pointer p-4 rounded-2xl shadow-sm transition-all duration-150 border ${
                    isSelected
                      ? 'bg-surface-container-lowest ring-2 ring-primary border-primary/50'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low border-surface-container-high/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-md">
                          {emi.lender}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">
                          {emi.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface">{emi.title}</h3>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-on-surface tabular-nums">
                        {formatINR(emi.monthlyEMI)}
                        <span className="text-[10px] font-normal text-on-surface-variant">
                          /mo
                        </span>
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {emi.annualInterestRate}% p.a. &middot; {emi.tenureMonths} mos
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-surface-container-high/40 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>Principal: {formatINR(emi.principalAmount)}</span>
                    <span className="font-semibold text-secondary">
                      Auto-debit day {emi.autoDebitDay}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Selected Loan Breakdown & Schedule */}
        <div className="lg:col-span-7">
          {selectedEmi ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high/30 space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-surface-container-high/40">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary bg-primary-fixed px-2.5 py-0.5 rounded-md">
                      {selectedEmi.lender}
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">
                      {selectedEmi.category} Loan
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-on-surface">
                    {selectedEmi.title}
                  </h2>
                </div>

                <div className="text-right">
                  <p className="text-xs text-on-surface-variant">Monthly Payment</p>
                  <p className="text-2xl font-extrabold text-primary tabular-nums">
                    {formatINR(selectedEmi.monthlyEMI)}
                  </p>
                </div>
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-3 gap-3 bg-surface-container-low p-4 rounded-xl text-center">
                <div>
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase">
                    Loan Amount
                  </p>
                  <p className="text-sm font-extrabold text-on-surface mt-0.5">
                    {formatINR(selectedEmi.principalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase">
                    Interest Rate
                  </p>
                  <p className="text-sm font-extrabold text-on-surface mt-0.5">
                    {selectedEmi.annualInterestRate}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase">
                    Tenure
                  </p>
                  <p className="text-sm font-extrabold text-on-surface mt-0.5">
                    {selectedEmi.tenureMonths} Months
                  </p>
                </div>
              </div>

              {/* Installment Payment History & Schedule */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-on-surface flex items-center justify-between">
                  <span>Amortization & Payment Schedule</span>
                  <span className="text-xs font-normal text-on-surface-variant">
                    {selectedEmi.payments.length} installments tracked
                  </span>
                </h3>

                <div className="divide-y divide-surface-container-high/30">
                  {selectedEmi.payments.map((p) => (
                    <div
                      key={p.id}
                      className="py-3.5 flex items-center justify-between hover:bg-surface-container-low/40 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            p.status === 'PAID'
                              ? 'bg-secondary-container/50 text-secondary'
                              : 'bg-primary-fixed text-primary'
                          }`}
                        >
                          {p.status === 'PAID' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            Installment #{p.installmentNo}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            Due:{' '}
                            {new Date(p.dueDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            &middot; Principal: {formatINR(p.principalPart)} &middot; Interest: {formatINR(p.interestPart)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-bold text-on-surface tabular-nums">
                            {formatINR(p.amount)}
                          </span>
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              p.status === 'PAID' ? 'text-secondary' : 'text-primary'
                            }`}
                          >
                            {p.status}
                          </p>
                        </div>

                        {p.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => handlePayInstallment(p.id)}
                            className="px-3 py-1.5 text-xs font-bold bg-primary text-on-primary hover:bg-primary-container rounded-lg transition-all"
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center text-on-surface-variant border border-surface-container-high/30">
              No loan accounts found. Add your first EMI loan to begin tracking.
            </div>
          )}
        </div>
      </div>

      {/* Add Loan Modal */}
      {isAddEmiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-surface-container-high/50">
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/40">
              <h3 className="text-base font-bold text-on-surface">Add Loan / EMI</h3>
              <button
                onClick={() => setIsAddEmiOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEMI} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Loan Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. HDFC Home Loan, SBI Auto Loan"
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Lender / Bank *
                  </label>
                  <input
                    type="text"
                    required
                    value={lender}
                    onChange={(e) => setLender(e.target.value)}
                    placeholder="e.g. HDFC Bank, ICICI"
                    className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                  >
                    <option value="Home">Home Loan</option>
                    <option value="Auto">Auto Loan</option>
                    <option value="Personal">Personal Loan</option>
                    <option value="Education">Education Loan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Principal Amount in ₹ (INR) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value)}
                  placeholder="₹ 45,00,000"
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Interest Rate (% p.a.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={annualInterestRate}
                    onChange={(e) => setAnnualInterestRate(e.target.value)}
                    placeholder="8.50"
                    className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Tenure (Months) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                    placeholder="240"
                    className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Monthly Auto-Debit Day (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={autoDebitDay}
                  onChange={(e) => setAutoDebitDay(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-transparent focus:border-primary focus:bg-surface-container-lowest outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddEmiOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-primary text-on-primary hover:bg-primary-container rounded-xl shadow-xs"
                >
                  Save Loan & Generate Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
