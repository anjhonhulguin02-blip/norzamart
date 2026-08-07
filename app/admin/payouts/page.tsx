"use client";

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

interface Payout {
  _id: string;
  seller: { storeName: string };
  amount: number;
  method: 'gcash' | 'bank';
  accountName: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [confirmTarget, setConfirmTarget] = useState<{ payout: Payout; action: 'approved' | 'rejected' } | null>(null);

  const fetchPayouts = async () => {
    const res = await fetch('/api/admin/payouts');
    const data = await res.json();
    setPayouts(data.payouts || []);
    setLoading(false);
  };

  useEffect(() => { fetchPayouts(); }, []);

  const handleProcess = async (id: string, status: 'approved' | 'rejected') => {
    await fetch(`/api/admin/payouts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setPayouts((prev) => prev.map((p) => (p._id === id ? { ...p, status } : p)));
  };

  const statusColor = (s: string) =>
    s === 'approved' ? 'bg-basil/15 text-basil' : s === 'rejected' ? 'bg-tomato/15 text-tomato' : 'bg-yellow-100 text-yellow-700';

  const filtered = filter === 'all' ? payouts : payouts.filter((p) => p.status === filter);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Payouts</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Review and process seller withdrawal requests.</p>

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
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-6">
          <span className="text-4xl mb-3 block">💰</span>
          <p className="text-ink/50 text-sm font-body">No {filter !== 'all' ? filter : ''} withdrawal requests.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-6">
          {filtered.map((p) => (
            <div key={p._id} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold text-sm text-ink">{p.seller?.storeName || 'Unknown Store'}</p>
                <p className="font-mono text-lg font-bold text-basil mt-0.5">₱{p.amount.toFixed(2)}</p>
                <p className="text-ink/50 text-xs mt-0.5">
                  {p.method === 'gcash' ? 'GCash' : 'Bank Transfer'} • {p.accountName} • {p.accountNumber}
                </p>
                <p className="text-ink/30 text-[10px] mt-0.5">{new Date(p.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${statusColor(p.status)}`}>{p.status}</span>
                {p.status === 'pending' && (
                  <>
                    <button onClick={() => setConfirmTarget({ payout: p, action: 'approved' })}
                      className="bg-basil/10 hover:bg-basil/20 text-basil text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      Approve
                    </button>
                    <button onClick={() => setConfirmTarget({ payout: p, action: 'rejected' })}
                      className="bg-tomato/10 hover:bg-tomato/20 text-tomato text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!confirmTarget}
        title={confirmTarget?.action === 'approved' ? 'Approve withdrawal?' : 'Reject withdrawal?'}
        message={`₱${confirmTarget?.payout.amount.toFixed(2)} to ${confirmTarget?.payout.seller?.storeName} via ${confirmTarget?.payout.method === 'gcash' ? 'GCash' : 'Bank Transfer'}.`}
        confirmLabel={confirmTarget?.action === 'approved' ? 'Approve' : 'Reject'}
        danger={confirmTarget?.action === 'rejected'}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => confirmTarget && handleProcess(confirmTarget.payout._id, confirmTarget.action)}
      />
    </div>
  );
}
