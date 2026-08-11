"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import { fileToBase64, uploadIfNew } from '@/lib/uploadImage';
import { getPusherClient } from '@/lib/pusherClient';

interface Message {
  _id: string;
  sender: string;
  senderName: string;
  text: string;
  image?: string;
  seen: boolean;
  createdAt: string;
}

interface ConversationInfo {
  buyer: { _id: string; name: string; avatar?: string };
  seller: { _id: string; storeName: string; storeLogo?: string; user: { _id: string } };
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `Sent ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Sent ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Sent yesterday';
  if (days < 7) return `Sent ${days}d ago`;
  return `Sent ${new Date(dateStr).toLocaleDateString()}`;
}

export default function ChatThreadPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { data: session } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPendingImage(await fileToBase64(f));
    e.target.value = '';
  };

  const fetchMessages = async () => {
    const res = await fetch(`/api/chat/${conversationId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      setConversation(data.conversation || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    // Real-time push (below) delivers new messages instantly; this is just a
    // safety-net refresh in case a push event is ever missed.
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-conversation-${conversationId}`);
    const handler = () => fetchMessages();
    channel.bind('message', handler);

    return () => {
      channel.unbind('message', handler);
      pusher.unsubscribe(`private-conversation-${conversationId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNewMessage = messages.length > prevMessageCount.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    // Only auto-scroll if a new message arrived AND the user is already near the bottom
    // (or this is the first load). This stops polling from yanking the view down
    // while someone is reading older messages further up.
    if (isNewMessage && (isNearBottom || prevMessageCount.current === 0)) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  const myUserId = (session?.user as any)?.id;
  const isBuyer = conversation?.buyer._id === myUserId;
  const otherName = conversation ? (isBuyer ? conversation.seller.storeName : conversation.buyer.name) : '';
  const otherAvatar = conversation ? (isBuyer ? conversation.seller.storeLogo : conversation.buyer.avatar) : undefined;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !pendingImage) return;
    setSending(true);
    setSendError('');
    try {
      const uploadedImage = await uploadIfNew(pendingImage, 'chat');
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, image: uploadedImage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.message || 'Failed to send message.');
        setSending(false);
        return;
      }
      setText('');
      setPendingImage(null);
      await fetchMessages();
    } catch (err: any) {
      setSendError(err?.message || 'Unable to connect to the server.');
    }
    setSending(false);
  };

  // Group consecutive messages from the same sender; show timestamp caption
  // only under the LAST message of each group (Messenger-style).
  const groups: Message[][] = [];
  messages.forEach((m) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup[0].sender === m.sender) {
      lastGroup.push(m);
    } else {
      groups.push([m]);
    }
  });

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl shadow-lg flex-1 flex flex-col overflow-hidden">

          {conversation && (
            <div className="flex items-center gap-3 px-5 py-4 border-b border-ink/10 bg-white/40">
              <div className="w-10 h-10 rounded-full bg-basil/10 flex items-center justify-center overflow-hidden shrink-0">
                {otherAvatar ? (
                  <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{isBuyer ? '🏬' : '🧑'}</span>
                )}
              </div>
              <p className="font-display font-semibold text-basil">{otherName}</p>
            </div>
          )}

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4" style={{ maxHeight: '55vh' }}>
            {loading ? (
              <p className="text-ink/50 text-sm font-body">Loading messages…</p>
            ) : groups.length === 0 ? (
              <p className="text-ink/50 text-sm font-body text-center mt-10">Say hello! 👋</p>
            ) : (
              groups.map((group, gi) => {
                const isMe = group[0].sender === myUserId;
                const lastMsg = group[group.length - 1];
                return (
                  <div key={gi} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}>
                    {!isMe && (
                      <p className="text-[10px] font-bold text-ink/50 ml-1">{group[0].senderName}</p>
                    )}
                    {group.map((m) => (
                      <div
                        key={m._id}
                        className={`max-w-[75%] rounded-2xl overflow-hidden ${
                          m.image && !m.text ? '' : 'px-4 py-2.5'
                        } text-sm ${
                          isMe ? 'bg-basil text-white' : 'bg-white text-ink border border-ink/10'
                        }`}
                      >
                        {m.image && (
                          <img
                            src={m.image}
                            alt="Attachment"
                            className={`max-w-[220px] max-h-[220px] object-cover rounded-xl ${m.text ? 'mb-2' : ''}`}
                          />
                        )}
                        {m.text}
                      </div>
                    ))}
                    <p className={`text-[10px] text-ink/40 ${isMe ? 'mr-1' : 'ml-1'} flex items-center gap-1`}>
                      {timeAgo(lastMsg.createdAt)}
                      {isMe && <span>{lastMsg.seen ? '✓✓' : '✓'}</span>}
                    </p>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {sendError && (
            <p className="text-tomato text-xs font-semibold px-5 pb-2">{sendError}</p>
          )}

          {pendingImage && (
            <div className="px-5 pb-2 flex items-center gap-2">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-ink/10">
                <img src={pendingImage} alt="Selected" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="absolute top-0 right-0 bg-tomato text-white w-4 h-4 text-[10px] flex items-center justify-center rounded-bl-md"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="border-t border-ink/10 p-3 flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePickImage}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-ink/10 hover:bg-basil/10 transition-all text-lg"
              aria-label="Attach image"
            >
              📷
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 min-w-0 bg-white border border-ink/10 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40"
            />
            <button
              type="submit"
              disabled={sending || (!text.trim() && !pendingImage)}
              className="bg-basil hover:bg-basil-light disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}