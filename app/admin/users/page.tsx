"use client";

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'buyer' });

  const [banTarget, setBanTarget] = useState<User | null>(null);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (u: User) => {
    setError('');
    setEditingUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingId(editingUser._id);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
      } else {
        setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? data.user : u)));
        setEditingUser(null);
      }
    } catch {
      setError('Unable to connect to the server.');
    }
    setSavingId(null);
  };

  const toggleBan = async (u: User) => {
    const newStatus = u.status === 'banned' ? 'active' : 'banned';
    setSavingId(u._id);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${u._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
      } else {
        setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, status: newStatus } : x)));
      }
    } catch {
      setError('Unable to connect to the server.');
    }
    setSavingId(null);
  };

  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Users</h1>
      <p className="text-ink/60 text-sm font-body mt-1">All registered accounts.</p>

      {error && !editingUser && (
        <div className="bg-tomato/10 border border-tomato/20 text-tomato text-xs font-semibold rounded-xl p-3 mt-5 text-center">{error}</div>
      )}

      <div className="flex gap-2 mt-5">
        {['all', 'buyer', 'seller', 'admin'].map((f) => (
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
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {filtered.map((u, i) => (
            <div key={u._id} className={`flex items-center justify-between flex-wrap gap-3 p-4 ${i !== filtered.length - 1 ? 'border-b border-ink/5' : ''}`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-ink">{u.name}</p>
                  {u.status === 'banned' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tomato/15 text-tomato">Suspended</span>
                  )}
                </div>
                <p className="text-ink/50 text-xs">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                  u.role === 'admin' ? 'bg-ink/10 text-ink' : u.role === 'seller' ? 'bg-basil/15 text-basil' : 'bg-white/70 text-ink/60'
                }`}>{u.role}</span>
                <span className="text-ink/40 text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</span>
                <button onClick={() => openEdit(u)} disabled={savingId === u._id}
                  className="bg-basil/10 hover:bg-basil/20 text-basil text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                  Edit
                </button>
                <button onClick={() => (u.status === 'banned' ? toggleBan(u) : setBanTarget(u))} disabled={savingId === u._id}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                    u.status === 'banned' ? 'bg-basil/10 hover:bg-basil/20 text-basil' : 'bg-tomato/10 hover:bg-tomato/20 text-tomato'
                  }`}>
                  {u.status === 'banned' ? 'Unban' : 'Ban'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-display text-lg font-semibold text-ink">Edit User</h3>
            {error && (
              <div className="bg-tomato/10 border border-tomato/20 text-tomato text-xs font-semibold rounded-xl p-3 mt-3 text-center">{error}</div>
            )}
            <form onSubmit={saveEdit} className="flex flex-col gap-3 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40 text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40 text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40 text-gray-800">
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-3">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="text-ink/50 hover:text-ink font-bold px-4 py-2 rounded-xl text-sm transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={savingId === editingUser._id}
                  className="bg-basil hover:bg-basil-light disabled:opacity-60 font-bold px-4 py-2 rounded-xl text-sm text-white transition-all">
                  {savingId === editingUser._id ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        open={!!banTarget}
        title="Suspend this account?"
        message={`${banTarget?.name} won't be able to sign in to NorzaMart while suspended. You can unban them anytime.`}
        confirmLabel="Suspend"
        danger
        onConfirm={() => banTarget && toggleBan(banTarget)}
        onClose={() => setBanTarget(null)}
      />
    </div>
  );
}
