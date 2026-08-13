"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { getPusherClient } from '@/lib/pusherClient';
import { useToast } from './ui/Toast';

interface Notif {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TYPE_ICON: Record<string, string> = {
  order_status: '📦',
  new_message: '💬',
  new_review: '⭐',
  seller_new_order: '🛍',
  payout_update: '💰',
  product_status: '🏷️',
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifs(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Real-time push handles instant updates; this is just a safety-net refresh
    // in case a push event is ever missed (e.g. a brief disconnect).
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-user-${userId}`);
    const handler = (notif: Notif) => {
      setNotifs((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      showToast(notif.title, 'success');
    };
    channel.bind('notification', handler);

    return () => {
      channel.unbind('notification', handler);
      pusher.unsubscribe(`private-user-${userId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(session?.user as any)?.id]);

  const handleOpen = async () => {
    setOpen(!open);
    if (!open && unreadCount > 0) {
      await fetch('/api/notifications/mark-read', { method: 'PUT' });
      setUnreadCount(0);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  if (!session) return null;

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative cursor-pointer bg-white/70 hover:bg-white text-basil w-10 h-10 rounded-full flex items-center justify-center border border-white/70 shadow-sm transition-all"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-tomato text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 sm:w-80 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/70 rounded-2xl shadow-2xl z-50"
            >
              <div className="px-4 py-3 border-b border-ink/10">
                <p className="font-display font-semibold text-basil text-sm">Notifications</p>
              </div>
              {notifs.length === 0 ? (
                <p className="text-ink/50 text-xs font-body p-6 text-center">No notifications yet.</p>
              ) : (
                notifs.map((n) => (
                  <Link
                    key={n._id}
                    href={n.link || '#'}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 px-4 py-3 hover:bg-basil/5 transition-colors border-b border-ink/5 last:border-0 ${
                      !n.read ? 'bg-basil/5' : ''
                    }`}
                  >
                    <span className="text-lg shrink-0">{TYPE_ICON[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink">{n.title}</p>
                      {n.body && <p className="text-ink/50 text-[11px] mt-0.5 truncate">{n.body}</p>}
                      <p className="text-ink/30 text-[10px] mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </Link>
                ))
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}