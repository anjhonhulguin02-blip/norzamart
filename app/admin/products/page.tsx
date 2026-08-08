"use client";

import React, { useEffect, useState } from 'react';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  approvalStatus: string;
  rejectionReason?: string;
  seller?: { storeName: string };
}

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-basil/15 text-basil',
  rejected: 'bg-tomato/15 text-tomato',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('pending');

  const [rejectTarget, setRejectTarget] = useState<Product | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const fetchProducts = async () => {
    const res = await fetch('/api/admin/products');
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setUpdatingId(id);
    await fetch(`/api/admin/products/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p)));
    setUpdatingId(null);
  };

  const approve = async (id: string) => {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/products/${id}/approval`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus: 'approved' }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, approvalStatus: 'approved' } : p)));
    }
    setUpdatingId(null);
  };

  const submitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectError('Please provide a reason.');
      return;
    }
    setUpdatingId(rejectTarget._id);
    const res = await fetch(`/api/admin/products/${rejectTarget._id}/approval`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus: 'rejected', rejectionReason: rejectReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRejectError(data.message || 'Something went wrong.');
    } else {
      setProducts((prev) => prev.map((p) => (p._id === rejectTarget._id ? { ...p, approvalStatus: 'rejected', rejectionReason: rejectReason } : p)));
      setRejectTarget(null);
      setRejectReason('');
    }
    setUpdatingId(null);
  };

  const filtered = filter === 'all' ? products : products.filter((p) => p.approvalStatus === filter);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Products</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Review new listings and moderate products across all sellers.</p>

      <div className="flex gap-2 mt-5">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
              filter === f ? 'bg-basil text-white' : 'bg-white/60 text-ink/60 hover:bg-basil/5'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-ink/50 text-sm font-body mt-6">Nothing here.</p>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {filtered.map((p, i) => (
            <div key={p._id} className={`flex items-center justify-between flex-wrap gap-3 p-4 ${i !== filtered.length - 1 ? 'border-b border-ink/5' : ''}`}>
              <div>
                <p className="text-sm font-bold text-ink">{p.name}</p>
                <p className="text-ink/50 text-xs">{p.seller?.storeName} • {p.category} • ₱{p.price}</p>
                {p.approvalStatus === 'rejected' && p.rejectionReason && (
                  <p className="text-tomato text-xs mt-1">Reason: {p.rejectionReason}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${APPROVAL_BADGE[p.approvalStatus] || APPROVAL_BADGE.pending}`}>
                  {p.approvalStatus}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  p.status === 'active' ? 'bg-basil/15 text-basil' : 'bg-tomato/15 text-tomato'
                }`}>{p.status}</span>

                {p.approvalStatus !== 'approved' && (
                  <button onClick={() => approve(p._id)} disabled={updatingId === p._id}
                    className="bg-basil/10 hover:bg-basil/20 text-basil text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                    Approve
                  </button>
                )}
                {p.approvalStatus !== 'rejected' && (
                  <button onClick={() => { setRejectTarget(p); setRejectReason(''); setRejectError(''); }} disabled={updatingId === p._id}
                    className="bg-tomato/10 hover:bg-tomato/20 text-tomato text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                    Reject
                  </button>
                )}
                <button
                  onClick={() => toggleStatus(p._id, p.status)}
                  disabled={updatingId === p._id}
                  className="bg-ink/5 hover:bg-ink/10 text-ink text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  {p.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setRejectTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-display text-lg font-semibold text-ink">Reject "{rejectTarget.name}"?</h3>
            <p className="text-ink/60 text-sm font-body mt-2">Let the seller know why, so they can fix and resubmit.</p>
            {rejectError && (
              <div className="bg-tomato/10 border border-tomato/20 text-tomato text-xs font-semibold rounded-xl p-3 mt-3 text-center">{rejectError}</div>
            )}
            <form onSubmit={submitReject} className="flex flex-col gap-3 mt-4">
              <textarea
                required
                rows={3}
                placeholder="e.g. Product photo is unclear, please re-upload."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tomato/40 text-gray-800"
              />
              <div className="flex justify-end gap-3 mt-1">
                <button type="button" onClick={() => setRejectTarget(null)}
                  className="text-ink/50 hover:text-ink font-bold px-4 py-2 rounded-xl text-sm transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={updatingId === rejectTarget._id}
                  className="bg-tomato hover:bg-tomato/90 disabled:opacity-60 font-bold px-4 py-2 rounded-xl text-sm text-white transition-all">
                  {updatingId === rejectTarget._id ? 'Rejecting…' : 'Reject Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
