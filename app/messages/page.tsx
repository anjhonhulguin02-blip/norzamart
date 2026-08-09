"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import { getPusherClient } from '@/lib/pusherClient';

interface Conversation {
  _id: string;
  buyer: { _id: string; name: string; avatar?: string };
  seller: { _id: string; storeName: string; storeLogo?: string; user: { _id: string; name: string } };
  product?: { name: string };
  lastMessage?: string;
  lastMessageAt: string;
  buyerUnread: number;
  sellerUnread: number;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [myUserId, setMyUserId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch('/api/chat/conversations');
    const data = await res.json();
    setConversations(data.conversations || []);
    setMyUserId(data.myUserId || '');
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-user-${userId}`);
    const handler = (notif: { type: string }) => {
      if (notif.type === 'new_message') load();
    };
    channel.bind('notification', handler);

    return () => {
      channel.unbind('notification', handler);
      pusher.unsubscribe(`private-user-${userId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(session?.user as any)?.id]);

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-semibold text-basil mb-6">Messages</h1>

        {loading ? (
          <p className="text-ink/50 text-sm font-body">Loading conversations…</p>
        ) : conversations.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg">
            <span className="text-4xl mb-3 block">💬</span>
            <h2 className="font-display text-xl font-semibold text-basil mb-1">No conversations yet</h2>
            <p className="text-ink/50 text-sm font-body">Messages with sellers will show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map((c) => {
              const isBuyer = c.buyer._id === myUserId;
              const otherName = isBuyer ? c.seller.storeName : c.buyer.name;
              const otherAvatar = isBuyer ? c.seller.storeLogo : c.buyer.avatar;
              const unread = isBuyer ? c.buyerUnread : c.sellerUnread;

              return (
                <Link
                  key={c._id}
                  href={`/messages/${c._id}`}
                  className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-basil/10 flex items-center justify-center overflow-hidden shrink-0">
                    {otherAvatar ? (
                      <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{isBuyer ? '🏬' : '🧑'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-black text-ink' : 'font-bold text-ink'}`}>
                      {otherName}
                    </p>
                    <p className={`text-xs font-body truncate ${unread > 0 ? 'text-ink font-semibold' : 'text-ink/50'}`}>
                      {c.lastMessage || 'Say hello!'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-ink/40 text-[11px]">
                      {new Date(c.lastMessageAt).toLocaleDateString()}
                    </span>
                    {unread > 0 && (
                      <span className="bg-tomato text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}