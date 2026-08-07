"use client";

import React, { useEffect, useState } from 'react';

interface Seller {
  _id: string;
  storeName: string;
  ownerName: string;
  barangay: string;
  status: string;
  contactNumber: string;
  email: string;
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchSellers = async () => {
    const res = await fetch('/api/admin/sellers');
    const data = await res.json();
    setSellers(data.sellers || []);
    setLoading(false);
  };

  useEffect(() => { fetchSellers(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/admin/sellers/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSellers((prev) => prev.map((s) => (s._id === id ? { ...s, status } : s)));
    setUpdatingId(null);
  };

  const filtered = filter === 'all' ? sellers : sellers.filter((s) => s.status === filter);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Sellers</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Verify and manage seller accounts.</p>

      <div className="flex gap-2 mt-5">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
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
      ) : (
        <div className="flex flex-col gap-3 mt-6">
          {filtered.map((s) => (
            <div key={s._id} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold text-sm text-ink">{s.storeName}</p>
                <p className="text-ink/50 text-xs">{s.ownerName} • {s.barangay}</p>
                <p className="text-ink/40 text-[11px]">{s.email} • {s.contactNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                  s.status === 'approved' ? 'bg-basil/15 text-basil' : s.status === 'rejected' ? 'bg-tomato/15 text-tomato' : 'bg-yellow-100 text-yellow-700'
                }`}>{s.status}</span>
                {s.status !== 'approved' && (
                  <button onClick={() => updateStatus(s._id, 'approved')} disabled={updatingId === s._id}
                    className="bg-basil/10 hover:bg-basil/20 text-basil text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                    Approve
                  </button>
                )}
                {s.status !== 'rejected' && (
                  <button onClick={() => updateStatus(s._id, 'rejected')} disabled={updatingId === s._id}
                    className="bg-tomato/10 hover:bg-tomato/20 text-tomato text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}