"use client";

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

interface Barangay {
  _id: string;
  name: string;
}

export default function AdminBarangaysPage() {
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Barangay | null>(null);

  const fetchBarangays = async () => {
    const res = await fetch('/api/barangays');
    const data = await res.json();
    setBarangays(data.barangays || []);
    setLoading(false);
  };

  useEffect(() => { fetchBarangays(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/barangays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      setBarangays((prev) => [...prev, data.barangay].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
    } catch {
      setError('Unable to connect to the server.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/barangays/${id}`, { method: 'DELETE' });
    setBarangays((prev) => prev.filter((b) => b._id !== id));
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Barangays</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Manage the barangays covered by NorzaMart.</p>

      <form onSubmit={handleAdd} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm mt-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-ink/70 mb-1">Barangay Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. San Isidro"
            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <button type="submit" disabled={submitting || !name.trim()}
          className="bg-basil hover:bg-basil-light disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
          + Add Barangay
        </button>
      </form>

      {error && <p className="text-tomato text-xs font-semibold mt-2">{error}</p>}

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {barangays.map((b, i) => (
            <div key={b._id} className={`flex items-center justify-between p-4 ${i !== barangays.length - 1 ? 'border-b border-ink/5' : ''}`}>
              <p className="text-sm font-bold text-ink">📍 {b.name}</p>
              <button onClick={() => setDeleteTarget(b)}
                className="text-xs font-bold text-tomato/70 hover:text-tomato px-2 transition-colors">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        title="Delete barangay?"
        message={`"${deleteTarget?.name}" will no longer appear in dropdowns. Sellers/buyers who already reference it keep their saved text.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget._id)}
      />
    </div>
  );
}
