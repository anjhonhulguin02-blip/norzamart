"use client";

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

interface Category {
  _id: string;
  name: string;
  icon: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      setCategories((prev) => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setIcon('');
    } catch {
      setError('Unable to connect to the server.');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    setCategories((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Categories</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Manage the categories sellers can choose from.</p>

      <form onSubmit={handleAdd} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Icon (emoji)</label>
          <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🛒"
            className="w-20 bg-white border border-ink/10 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-ink/70 mb-1">Category Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frozen Foods"
            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <button type="submit" disabled={submitting || !name.trim()}
          className="bg-basil hover:bg-basil-light disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
          + Add Category
        </button>
      </form>

      {error && <p className="text-tomato text-xs font-semibold mt-2">{error}</p>}

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {categories.map((c, i) => (
            <div key={c._id} className={`flex items-center justify-between p-4 ${i !== categories.length - 1 ? 'border-b border-ink/5' : ''}`}>
              <p className="text-sm font-bold text-ink">
                <span className="mr-2">{c.icon}</span>{c.name}
              </p>
              <button onClick={() => setDeleteTarget(c)}
                className="text-xs font-bold text-tomato/70 hover:text-tomato px-2 transition-colors">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        title="Delete category?"
        message={`"${deleteTarget?.name}" will no longer appear in dropdowns. Existing products keep their category text.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget._id)}
      />
    </div>
  );
}
