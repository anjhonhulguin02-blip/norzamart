"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Notif {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  order_status: '📦',
  new_message: '💬',
  new_review: '⭐',
  seller_new_order: '🛍',
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifs(data.notifications || []);
      setLoading(false);
      if ((data.unreadCount || 0) > 0) {
        await fetch('/api/notifications/mark-read', { method: 'PUT' });
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Notifications</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Updates on your orders, messages, and more.</p>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-8">Loading…</p>
      ) : notifs.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-8">
          <span className="text-4xl mb-3 block">🔔</span>
          <p className="text-ink/50 text-sm font-body">You're all caught up.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-8">
          {notifs.map((n) => (
            <Link
              key={n._id}
              href={n.link || '#'}
              className={`bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 flex gap-3 shadow-sm hover:shadow-md transition-all ${
                !n.read ? 'border-basil/30' : ''
              }`}
            >
              <span className="text-xl shrink-0">{TYPE_ICON[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">{n.title}</p>
                {n.body && <p className="text-ink/50 text-xs font-body mt-0.5">{n.body}</p>}
                <p className="text-ink/30 text-[11px] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}