"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getPusherClient } from '@/lib/pusherClient';

interface Conversation {
  _id: string;
  buyer: { _id: string; name: string; avatar?: string };
  lastMessage?: string;
  lastMessageAt: string;
  sellerUnread: number;
}

export default function SellerMessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch('/api/chat/conversations');
    const data = await res.json();
    setConversations(data.conversations || []);
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
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Messages</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Conversations with your customers.</p>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-8">Loading…</p>
      ) : conversations.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-8">
          <span className="text-4xl mb-3 block">💬</span>
          <p className="text-ink/50 text-sm font-body">No messages yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-6">
          {conversations.map((c) => (
            <Link
              key={c._id}
              href={`/messages/${c._id}`}
              className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-basil/10 flex items-center justify-center overflow-hidden shrink-0">
                {c.buyer.avatar ? (
                  <img src={c.buyer.avatar} alt={c.buyer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">🧑</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${c.sellerUnread > 0 ? 'font-black text-ink' : 'font-bold text-ink'}`}>
                  {c.buyer?.name}
                </p>
                <p className={`text-xs font-body truncate ${c.sellerUnread > 0 ? 'text-ink font-semibold' : 'text-ink/50'}`}>
                  {c.lastMessage || 'Say hello!'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-ink/40 text-[11px]">
                  {new Date(c.lastMessageAt).toLocaleDateString()}
                </span>
                {c.sellerUnread > 0 && (
                  <span className="bg-tomato text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {c.sellerUnread > 9 ? '9+' : c.sellerUnread}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}