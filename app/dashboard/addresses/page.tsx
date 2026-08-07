"use client";

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

interface Address {
  _id: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  barangay: string;
  isDefault: boolean;
}

const emptyForm = { label: '', recipientName: '', phone: '', address: '', barangay: '' };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [barangays, setBarangays] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);

  const fetchAddresses = async () => {
    const res = await fetch('/api/addresses');
    const data = await res.json();
    setAddresses(data.addresses || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAddresses();
    fetch('/api/barangays').then((res) => res.json()).then((data) => setBarangays(data.barangays || []));
  }, []);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const startAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (a: Address) => {
    setForm({ label: a.label, recipientName: a.recipientName, phone: a.phone, address: a.address, barangay: a.barangay });
    setEditingId(a._id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      await fetchAddresses();
      cancelForm();
    } catch {
      setError('Unable to connect to the server.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
    await fetchAddresses();
  };

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    await fetchAddresses();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-basil">Addresses</h1>
          <p className="text-ink/60 text-sm font-body mt-1">Save multiple delivery addresses for faster checkout.</p>
        </div>
        {!showForm && (
          <button onClick={startAdd}
            className="bg-basil hover:bg-basil-light text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            + Add Address
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Label *</label>
            <input required value={form.label} onChange={(e) => update('label', e.target.value)} placeholder="Home, Work, etc."
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Recipient Name *</label>
            <input required value={form.recipientName} onChange={(e) => update('recipientName', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Phone Number *</label>
            <input required value={form.phone} onChange={(e) => update('phone', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Barangay *</label>
            <select required value={form.barangay} onChange={(e) => update('barangay', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
              <option value="">Select barangay</option>
              {barangays.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-ink/70 mb-1">Full Address *</label>
            <textarea required rows={2} value={form.address} onChange={(e) => update('address', e.target.value)}
              placeholder="House no., street, landmark"
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          {error && <p className="md:col-span-2 text-tomato text-xs font-semibold">{error}</p>}

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={submitting}
              className="bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
              {submitting ? 'Saving…' : editingId ? 'Update Address' : 'Save Address'}
            </button>
            <button type="button" onClick={cancelForm}
              className="text-ink/50 hover:text-ink font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : addresses.length === 0 && !showForm ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-6">
          <span className="text-4xl mb-3 block">📍</span>
          <p className="text-ink/50 text-sm font-body">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {addresses.map((a) => (
            <div key={a._id} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-ink">{a.label}</p>
                  {a.isDefault && (
                    <span className="text-[10px] font-bold text-basil bg-basil/10 px-2 py-0.5 rounded-full">Default</span>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold text-ink">{a.recipientName} • {a.phone}</p>
              <p className="text-ink/60 text-xs font-body mt-1">{a.address}, {a.barangay}</p>

              <div className="flex items-center gap-3 mt-3">
                {!a.isDefault && (
                  <button onClick={() => handleSetDefault(a._id)} className="text-xs font-bold text-basil hover:underline">
                    Set as Default
                  </button>
                )}
                <button onClick={() => startEdit(a)} className="text-xs font-bold text-ink/50 hover:text-basil transition-colors">
                  Edit
                </button>
                <button onClick={() => setDeleteTarget(a)} className="text-xs font-bold text-tomato/70 hover:text-tomato transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        title="Delete address?"
        message={`"${deleteTarget?.label}" will be permanently removed from your address book.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget._id)}
      />
    </div>
  );
}
