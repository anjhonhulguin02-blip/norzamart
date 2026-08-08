"use client";

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

interface Announcement {
  _id: string;
  title: string;
  body: string;
  audience: 'all' | 'buyers' | 'sellers';
  active: boolean;
  createdAt: string;
}

const emptyForm = { title: '', body: '', audience: 'all' };

const AUDIENCE_LABEL: Record<string, string> = {
  all: 'Everyone',
  buyers: 'Buyers only',
  sellers: 'Sellers only',
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    const res = await fetch('/api/admin/announcements');
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/announcements', {
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
      setAnnouncements((prev) => [data.announcement, ...prev]);
      setForm(emptyForm);
    } catch {
      setError('Unable to connect to the server.');
    }
    setSubmitting(false);
  };

  const toggleActive = async (a: Announcement) => {
    await fetch(`/api/admin/announcements/${a._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !a.active }),
    });
    setAnnouncements((prev) => prev.map((x) => (x._id === a._id ? { ...x, active: !x.active } : x)));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    setAnnouncements((prev) => prev.filter((a) => a._id !== id));
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Announcements</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Post platform-wide messages to buyers and/or sellers.</p>

      <form onSubmit={handleAdd} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm mt-6 flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-ink/70 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Scheduled maintenance"
              className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Audience</label>
            <select value={form.audience} onChange={(e) => update('audience', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
              <option value="all">Everyone</option>
              <option value="buyers">Buyers only</option>
              <option value="sellers">Sellers only</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink/70 mb-1">Message *</label>
          <textarea rows={2} value={form.body} onChange={(e) => update('body', e.target.value)}
            placeholder="NorzaMart will be briefly unavailable tonight at 11PM for scheduled maintenance."
            className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
        </div>
        <button type="submit" disabled={submitting || !form.title.trim() || !form.body.trim()}
          className="self-start bg-basil hover:bg-basil-light disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
          + Post Announcement
        </button>
        {error && <p className="text-tomato text-xs font-semibold">{error}</p>}
      </form>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : announcements.length === 0 ? (
        <p className="text-ink/50 text-sm font-body mt-6">No announcements yet.</p>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {announcements.map((a, i) => (
            <div key={a._id} className={`flex items-start justify-between flex-wrap gap-3 p-4 ${i !== announcements.length - 1 ? 'border-b border-ink/5' : ''}`}>
              <div className="max-w-xl">
                <p className="font-bold text-sm text-ink">{a.title}</p>
                <p className="text-ink/60 text-xs mt-1">{a.body}</p>
                <p className="text-ink/40 text-[11px] mt-1.5">
                  {AUDIENCE_LABEL[a.audience]} • {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(a)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
                    a.active ? 'bg-basil/15 text-basil hover:bg-basil/25' : 'bg-ink/10 text-ink/50 hover:bg-ink/20'
                  }`}>
                  {a.active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => setDeleteTarget(a)}
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
        title="Delete announcement?"
        message={`"${deleteTarget?.title}" will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget._id)}
      />
    </div>
  );
}
