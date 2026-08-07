"use client";

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

interface Coupon {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minSpend: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
}

const emptyForm = { code: '', type: 'percent', value: '', minSpend: '', maxDiscount: '', expiresAt: '', usageLimit: '' };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    const res = await fetch('/api/admin/coupons');
    const data = await res.json();
    setCoupons(data.coupons || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/coupons', {
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
      setCoupons((prev) => [data.coupon, ...prev]);
      setForm(emptyForm);
    } catch {
      setError('Unable to connect to the server.');
    }
    setSubmitting(false);
  };

  const toggleActive = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    });
    setCoupons((prev) => prev.map((x) => (x._id === c._id ? { ...x, active: !x.active } : x)));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    setCoupons((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Coupons</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Create and manage platform-wide promo codes.</p>

      <form onSubmit={handleAdd} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Code *</label>
          <input value={form.code} onChange={(e) => update('code', e.target.value.toUpperCase())} placeholder="WELCOME10"
            className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Type *</label>
          <select value={form.type} onChange={(e) => update('type', e.target.value)}
            className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount off</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Value * {form.type === 'percent' ? '(%)' : '(₱)'}</label>
          <input type="number" min="0" value={form.value} onChange={(e) => update('value', e.target.value)}
            className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Min. Spend (₱)</label>
          <input type="number" min="0" value={form.minSpend} onChange={(e) => update('minSpend', e.target.value)}
            className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Max Discount (₱)</label>
          <input type="number" min="0" value={form.maxDiscount} onChange={(e) => update('maxDiscount', e.target.value)}
            placeholder="Percent only"
            className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Expires On</label>
          <input type="date" value={form.expiresAt} onChange={(e) => update('expiresAt', e.target.value)}
            className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Usage Limit</label>
          <input type="number" min="0" value={form.usageLimit} onChange={(e) => update('usageLimit', e.target.value)}
            placeholder="Unlimited"
            className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={submitting || !form.code.trim() || !form.value}
            className="w-full bg-basil hover:bg-basil-light disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all">
            + Add Coupon
          </button>
        </div>
      </form>

      {error && <p className="text-tomato text-xs font-semibold mt-2">{error}</p>}

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {coupons.map((c, i) => (
            <div key={c._id} className={`flex items-center justify-between flex-wrap gap-3 p-4 ${i !== coupons.length - 1 ? 'border-b border-ink/5' : ''}`}>
              <div>
                <p className="font-mono font-black text-sm text-ink">{c.code}</p>
                <p className="text-ink/50 text-xs mt-0.5">
                  {c.type === 'percent' ? `${c.value}% off` : `₱${c.value.toFixed(2)} off`}
                  {c.minSpend > 0 ? ` • Min ₱${c.minSpend.toFixed(2)}` : ''}
                  {c.usageLimit ? ` • Used ${c.usedCount}/${c.usageLimit}` : ` • Used ${c.usedCount}x`}
                  {c.expiresAt ? ` • Expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(c)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
                    c.active ? 'bg-basil/15 text-basil hover:bg-basil/25' : 'bg-ink/10 text-ink/50 hover:bg-ink/20'
                  }`}>
                  {c.active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => setDeleteTarget(c)}
                  className="text-xs font-bold text-tomato/70 hover:text-tomato px-2 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        title="Delete coupon?"
        message={`"${deleteTarget?.code}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget._id)}
      />
    </div>
  );
}
