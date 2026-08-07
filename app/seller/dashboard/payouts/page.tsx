"use client";

import React, { useEffect, useState } from 'react';

interface Payout {
  _id: string;
  amount: number;
  method: 'gcash' | 'bank';
  accountName: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
}

interface Balance {
  totalRevenue: number;
  totalReserved: number;
  available: number;
}

const emptyForm = { amount: '', method: 'gcash', accountName: '', accountNumber: '' };

export default function SellerPayoutsPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const res = await fetch('/api/seller/payouts');
    const data = await res.json();
    setBalance(data.balance || null);
    setPayouts(data.payouts || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/seller/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      setSuccess('Withdrawal request submitted!');
      setForm(emptyForm);
      await fetchData();
    } catch {
      setError('Unable to connect to the server.');
    }
    setSubmitting(false);
  };

  const statusColor = (s: string) =>
    s === 'approved' ? 'bg-basil/15 text-basil' : s === 'rejected' ? 'bg-tomato/15 text-tomato' : 'bg-yellow-100 text-yellow-700';

  if (loading) return <p className="text-ink/50 text-sm font-body">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Withdraw Earnings</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Request a payout of your available balance.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <div className="font-mono text-2xl font-bold text-basil">₱{balance?.available.toFixed(2)}</div>
          <div className="text-ink/50 text-xs font-body mt-1">Available to Withdraw</div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <div className="font-mono text-2xl font-bold text-ink">₱{balance?.totalRevenue.toFixed(2)}</div>
          <div className="text-ink/50 text-xs font-body mt-1">Total Revenue (Delivered)</div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <div className="font-mono text-2xl font-bold text-ink">₱{balance?.totalReserved.toFixed(2)}</div>
          <div className="text-ink/50 text-xs font-body mt-1">Pending + Approved Withdrawals</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <h2 className="md:col-span-2 font-display text-lg font-semibold text-basil">Request a Withdrawal</h2>

        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Amount (₱) *</label>
          <input type="number" min="1" step="0.01" required value={form.amount} onChange={(e) => update('amount', e.target.value)}
            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Payout Method *</label>
          <select required value={form.method} onChange={(e) => update('method', e.target.value)}
            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
            <option value="gcash">GCash</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Account Name *</label>
          <input required value={form.accountName} onChange={(e) => update('accountName', e.target.value)}
            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">
            {form.method === 'gcash' ? 'GCash Number *' : 'Account Number *'}
          </label>
          <input required value={form.accountNumber} onChange={(e) => update('accountNumber', e.target.value)}
            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>

        {error && <p className="md:col-span-2 text-tomato text-xs font-semibold">{error}</p>}
        {success && <p className="md:col-span-2 text-basil text-xs font-semibold">{success}</p>}

        <button type="submit" disabled={submitting || !balance || balance.available <= 0}
          className="md:col-span-2 bg-basil hover:bg-basil-light disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all">
          {submitting ? 'Submitting…' : balance && balance.available <= 0 ? 'No balance available' : 'Submit Request'}
        </button>
      </form>

      <h2 className="font-display text-lg font-semibold text-basil mt-8 mb-3">Withdrawal History</h2>
      {payouts.length === 0 ? (
        <p className="text-ink/50 text-sm font-body">No withdrawal requests yet.</p>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm overflow-hidden">
          {payouts.map((p, i) => (
            <div key={p._id} className={`flex items-center justify-between flex-wrap gap-2 p-4 ${i !== payouts.length - 1 ? 'border-b border-ink/5' : ''}`}>
              <div>
                <p className="font-mono font-bold text-sm text-ink">₱{p.amount.toFixed(2)}</p>
                <p className="text-ink/50 text-xs mt-0.5">
                  {p.method === 'gcash' ? 'GCash' : 'Bank Transfer'} • {p.accountName} • {p.accountNumber}
                </p>
                {p.adminNote && <p className="text-ink/40 text-xs mt-0.5 italic">"{p.adminNote}"</p>}
              </div>
              <div className="text-right">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${statusColor(p.status)}`}>{p.status}</span>
                <p className="text-ink/30 text-[10px] mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
