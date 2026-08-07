"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signOut, useSession } from 'next-auth/react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
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
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => setSuggestions(data.suggestions || []))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (authView === 'login') {
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "Invalid email or password. Please try again." : res.error);
      } else {
        setIsModalOpen(false);
        window.location.reload();
      }
    } else {
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          setSuccess('Registration successful! You can now log in.');
          setAuthView('login');
        } else {
          const data = await res.json();
          setError(data.message || 'An error occurred during registration.');
        }
      } catch {
        setError('Unable to connect to the server.');
      }
    }
    setIsSubmitting(false);
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
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full bg-white/50 backdrop-blur-xl border-b border-white/60 sticky top-0 z-50 shadow-[0_4px_30px_rgba(15,81,50,0.06)]"
      >
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">

          <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-basil flex items-center gap-1">
            Norza<span className="text-tomato">Mart</span>
          </Link>

          <div className="w-full md:w-1/2 relative">
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
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl border border-white/70 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-5 text-sm font-semibold text-ink">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 bg-white/60 hover:bg-white/80 border border-white/70 rounded-full pl-2 pr-3 py-1.5 transition-all"
                >
                  <span className="w-7 h-7 rounded-full bg-basil text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    {(session.user as any)?.avatar ? (
                      <img src={(session.user as any).avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (session.user?.name || 'C').charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="text-ink font-bold text-sm">{session.user?.name || 'Customer'}</span>
                  <span className="text-ink/40 text-xs">▾</span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-white/70 rounded-2xl shadow-2xl overflow-hidden z-50"
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
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => { setIsModalOpen(true); setAuthView('login'); setError(''); setSuccess(''); }}
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

      {isModalOpen && (
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen bg-ink/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white/90 backdrop-blur-lg border border-white/60 shadow-2xl rounded-3xl w-full max-w-md p-8 relative mx-4"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-ink/40 hover:text-ink text-lg font-bold bg-transparent border-none cursor-pointer outline-none transition-colors"
            >
              ✕
            </button>

            <h2 className="font-display text-2xl font-semibold text-center text-basil mb-1">
              {authView === 'login' ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="text-xs text-ink/50 text-center mb-6 font-body">
              {authView === 'login' ? 'Sign in for a faster checkout experience at NorzaMart.' : 'Join our community for fresh produce and daily groceries.'}
            </p>

            {error && <div className="bg-tomato/10 border border-tomato/20 text-tomato text-xs font-semibold rounded-xl p-3 mb-4 text-center">{error}</div>}
            {success && <div className="bg-basil/10 border border-basil/20 text-basil text-xs font-semibold rounded-xl p-3 mb-4 text-center">{success}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {authView === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Juan Dela Cruz"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-gray-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="juandelacruz@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-gray-800"
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md mt-2 text-sm transition-all tracking-wide border-none cursor-pointer">
                {isSubmitting ? 'Please wait…' : authView === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-600 mt-6">
              {authView === 'login' ? "Don't have an account yet? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => { setAuthView(authView === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
                className="text-emerald-700 font-extrabold hover:underline cursor-pointer bg-transparent border-none p-0 outline-none"
              >
                {authView === 'login' ? 'Register here' : 'Login here'}
              </button>
            </p>
          </motion.div>
        </div>
      )}
    </>
  );
}