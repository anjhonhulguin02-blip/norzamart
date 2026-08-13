"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import NotificationBell from './NotificationBell';
import { getPusherClient } from '@/lib/pusherClient';
import { useAuthPrompt } from './AuthPromptProvider';
import { useAnchoredMenuPosition } from '@/lib/useAnchoredMenuPosition';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { openAuthModal } = useAuthPrompt();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const { pos: profilePos, measure: measureProfilePos } = useAnchoredMenuPosition(profileButtonRef);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [cartCount, setCartCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [storeSuggestions, setStoreSuggestions] = useState<any[]>([]);
  const [popularSearches, setPopularSearches] = useState<{ term: string; count: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchCartCount = async () => {
    if (!session) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      const count = (data.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(count);
    } catch {
      // ignore
    }
  };

  const fetchChatCount = async () => {
    if (!session) {
      setChatCount(0);
      return;
    }
    try {
      const res = await fetch('/api/chat/conversations');
      const data = await res.json();
      const myUserId = data.myUserId;
      const total = (data.conversations || []).reduce((sum: number, c: any) => {
        const isBuyer = c.buyer._id === myUserId;
        return sum + (isBuyer ? c.buyerUnread : c.sellerUnread);
      }, 0);
      setChatCount(total);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCartCount();
    fetchChatCount();
    // Real-time push (below) handles instant updates; this is just a safety-net
    // refresh in case a push event is ever missed.
    const interval = setInterval(fetchChatCount, 60000);
    window.addEventListener('cart-updated', fetchCartCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('cart-updated', fetchCartCount);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-user-${userId}`);
    const handler = (notif: { type: string }) => {
      if (notif.type === 'new_message') fetchChatCount();
    };
    channel.bind('notification', handler);

    return () => {
      channel.unbind('notification', handler);
      pusher.unsubscribe(`private-user-${userId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(session?.user as any)?.id]);

  useEffect(() => {
    fetch('/api/search/popular')
      .then((res) => res.json())
      .then((data) => setPopularSearches(data.popular || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setStoreSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data.suggestions || []);
          setStoreSuggestions(data.stores || []);
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const runSearch = (term: string) => {
    setShowSuggestions(false);
    setSearchQuery(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleSellClick = async () => {
    setIsProfileOpen(false);
    try {
      const res = await fetch('/api/seller/me');
      const data = await res.json();
      if (data.isSeller) {
        router.push('/seller/dashboard');
      } else {
        router.push('/seller/register');
      }
    } catch {
      router.push('/seller/register');
    }
  };

  return (
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full bg-white/50 backdrop-blur-xl border-b border-white/60 sticky top-0 z-50 shadow-[0_4px_30px_rgba(15,81,50,0.06)]"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-3.5 flex flex-row flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-4">

          <Link href="/" className="order-1 font-display text-2xl font-semibold tracking-tight text-basil flex items-center gap-1">
            Norza<span className="text-tomato">Mart</span>
          </Link>

          <div className="order-3 md:order-2 w-full md:w-1/2 relative">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowSuggestions(false);
                router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
              }}
              className="flex items-center bg-white/60 backdrop-blur-sm border border-white/70 shadow-inner rounded-full px-4 py-2.5 focus-within:ring-2 focus-within:ring-basil/40 focus-within:bg-white/90 transition-all"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search for fresh vegetables, meat, or daily groceries..."
                className="bg-transparent w-full focus:outline-none text-sm text-ink placeholder-ink/40 font-body"
              />
              <button type="submit" className="text-basil/70 hover:text-basil transition-colors" aria-label="Search">
                🔍
              </button>
            </form>

            <AnimatePresence>
              {showSuggestions && searchQuery.trim().length < 2 && popularSearches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl border border-white/70 rounded-2xl shadow-2xl overflow-hidden z-50 p-4"
                >
                  <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wide mb-2">Popular Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((p) => (
                      <button
                        key={p.term}
                        onMouseDown={() => runSearch(p.term)}
                        className="text-xs font-semibold text-ink bg-basil/5 hover:bg-basil/10 px-3 py-1.5 rounded-full transition-colors capitalize"
                      >
                        🔥 {p.term}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {showSuggestions && searchQuery.trim().length >= 2 && (suggestions.length > 0 || storeSuggestions.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl border border-white/70 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  {storeSuggestions.length > 0 && (
                    <div className="border-b border-ink/5">
                      <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wide px-4 pt-3 pb-1">Stores</p>
                      {storeSuggestions.map((s) => (
                        <Link
                          key={s._id}
                          href={`/seller/${s._id}`}
                          onClick={() => setShowSuggestions(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-basil/5 transition-colors"
                        >
                          <div className="w-8 h-8 bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-ink/10">
                            {s.storeLogo ? <img src={s.storeLogo} alt={s.storeName} className="max-w-full max-h-full object-contain" /> : <span className="text-sm">🏬</span>}
                          </div>
                          <span className="text-sm font-semibold text-ink truncate flex-1">{s.storeName}</span>
                          {s.status === 'approved' && <span className="text-basil text-xs shrink-0">✔️</span>}
                        </Link>
                      ))}
                    </div>
                  )}

                  {suggestions.length > 0 && (
                    <div>
                      {storeSuggestions.length > 0 && (
                        <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wide px-4 pt-3 pb-1">Products</p>
                      )}
                      {suggestions.map((s) => (
                        <Link
                          key={s._id}
                          href={`/product/${s._id}`}
                          onClick={() => setShowSuggestions(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-basil/5 transition-colors"
                        >
                          <div className="w-8 h-8 bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-ink/10">
                            {s.image ? <img src={s.image} alt={s.name} className="max-w-full max-h-full object-contain" /> : <span className="text-sm">🛒</span>}
                          </div>
                          <span className="text-sm font-semibold text-ink truncate flex-1">{s.name}</span>
                          <span className="font-mono text-xs font-bold text-basil shrink-0">₱{s.price}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="order-2 md:order-3 flex items-center gap-3 md:gap-5 text-sm font-semibold text-ink">
            {session ? (
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => { if (!isProfileOpen) measureProfilePos(224); setIsProfileOpen(!isProfileOpen); }}
                  className="flex items-center gap-2 bg-white/60 hover:bg-white/80 border border-white/70 rounded-full pl-2 pr-3 py-1.5 transition-all"
                >
                  <span className="w-7 h-7 rounded-full bg-basil text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    {(session.user as any)?.avatar ? (
                      <img src={(session.user as any).avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (session.user?.name || 'C').charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="hidden md:inline text-ink font-bold text-sm">{session.user?.name || 'Customer'}</span>
                  <span className="text-ink/40 text-xs">▾</span>
                </button>

                {mounted && createPortal(
                  <AnimatePresence>
                    {isProfileOpen && profilePos && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          style={{ top: profilePos.top, left: profilePos.left, width: profilePos.width }}
                          className="fixed bg-white/95 backdrop-blur-xl border border-white/70 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                          <Link
                            href="/dashboard"
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-ink hover:bg-basil/5 transition-colors flex items-center gap-2"
                          >
                            🏠 My Dashboard
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-ink hover:bg-basil/5 transition-colors flex items-center gap-2"
                          >
                            ⚙️ Account Settings
                          </Link>
                          <div className="h-px bg-ink/10" />
                          <button
                            onClick={handleSellClick}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-ink hover:bg-basil/5 transition-colors flex items-center gap-2"
                          >
                            🏬 Sell on NorzaMart
                          </button>
                          <div className="h-px bg-ink/10" />
                          <button
                            onClick={() => { setIsProfileOpen(false); signOut({ callbackUrl: '/' }); }}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-tomato hover:bg-tomato/5 transition-colors"
                          >
                            Sign Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>,
                  document.body
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="bg-transparent border-none cursor-pointer font-semibold text-ink hover:text-basil transition-colors outline-none"
              >
                Sign In / Register
              </button>
            )}

            <NotificationBell />

            {session && (
              <Link
                href="/messages"
                aria-label="Messages"
                className="relative cursor-pointer bg-white/70 hover:bg-white text-basil w-10 h-10 rounded-full flex items-center justify-center border border-white/70 shadow-sm transition-all"
              >
                💬
                {chatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-tomato text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {chatCount > 9 ? '9+' : chatCount}
                  </span>
                )}
              </Link>
            )}

            {session && (
              <Link
                href="/dashboard/wishlist"
                aria-label="Wishlist"
                className="relative cursor-pointer bg-white/70 hover:bg-white text-tomato w-10 h-10 rounded-full flex items-center justify-center border border-white/70 shadow-sm transition-all"
              >
                ♡
              </Link>
            )}

            <Link
              href="/cart"
              aria-label="Basket"
              className="relative cursor-pointer bg-basil hover:bg-basil-light text-white px-4 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-basil/20 transition-all"
            >
              🛒 <span className="font-mono text-xs font-bold">{cartCount}</span>
            </Link>
          </div>
        </div>
      </motion.header>
  );
}