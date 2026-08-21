"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { getPusherClient } from '@/lib/pusherClient';
import { useToast } from './ui/Toast';
import { useAnchoredMenuPosition } from '@/lib/useAnchoredMenuPosition';
import { BasketIcon, BellIcon, ChatIcon, PackageIcon, StarIcon, TagIcon, WalletIcon } from './ui/NorzaIcons';

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

const TYPE_ICON: Record<string, typeof BellIcon> = {
  order_status: PackageIcon,
  new_message: ChatIcon,
  new_review: StarIcon,
  seller_new_order: BasketIcon,
  payout_update: WalletIcon,
  product_status: TagIcon,
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { pos, measure } = useAnchoredMenuPosition(buttonRef);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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
    if (!open) measure(320);
    setOpen(!open);
    if (!open && unreadCount > 0) {
      await fetch('/api/notifications/mark-read', { method: 'PUT' });
      setUnreadCount(0);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  if (!session) return null;

  const menu = mounted && createPortal(
    <AnimatePresence>
      {open && pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            role="menu"
            className="fixed z-50 max-h-96 overflow-y-auto rounded-card border border-line bg-paper shadow-float"
          >
            <div className="px-4 py-3 border-b border-ink/10">
              <p className="font-display font-semibold text-basil text-sm">Notifications</p>
            </div>
            {notifs.length === 0 ? (
              <p className="text-ink/50 text-xs font-body p-6 text-center">No notifications yet.</p>
            ) : (
              notifs.map((n) => {
                const TypeIcon = TYPE_ICON[n.type] || BellIcon;
                return (
                <Link
                  key={n._id}
                  href={n.link || '#'}
                  onClick={() => setOpen(false)}
                  className={`flex gap-3 px-4 py-3 hover:bg-basil/5 transition-colors border-b border-ink/5 last:border-0 ${
                    !n.read ? 'bg-basil/5' : ''
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-mint-wash text-basil"><TypeIcon size={17} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-ink">{n.title}</p>
                    {n.body && <p className="text-ink/50 text-[11px] mt-0.5 truncate">{n.body}</p>}
                    <p className="text-ink/30 text-[10px] mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </Link>
                );
              })
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleOpen}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
        className="nm-icon-button relative"
      >
        <BellIcon size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-tomato text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {menu}
    </div>
  );
}
