"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import NotificationBell from './NotificationBell';
import HeaderQuickPreviews from './HeaderQuickPreviews';
import { getPusherClient } from '@/lib/pusherClient';
import { useAuthPrompt } from './AuthPromptProvider';
import { useAnchoredMenuPosition } from '@/lib/useAnchoredMenuPosition';
import {
  ArrowRightIcon,
  BasketIcon,
  CategoryGridIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  CloseIcon,
  FlameIcon,
  HomeIcon,
  MarketCategoryIcon,
  SearchIcon,
  SettingsIcon,
  StoreIcon,
} from './ui/NorzaIcons';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { openAuthModal } = useAuthPrompt();
  const reduceMotion = useReducedMotion();

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
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [menuCategories, setMenuCategories] = useState<{ _id: string; name: string }[]>([]);

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
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setMenuCategories((data.categories || []).slice(0, 8)))
      .catch(() => setMenuCategories([]));
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCategoryMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
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
        initial={reduceMotion ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-50 w-full border-b border-line bg-white/96 shadow-[0_3px_16px_rgba(24,49,39,0.055)] backdrop-blur-lg"
      >
        <div className="nm-container flex flex-row flex-wrap items-center gap-2 py-2.5 sm:gap-3 lg:flex-nowrap xl:gap-4">

          <Link href="/" aria-label="NorzaMart home" className="order-1 flex min-h-11 items-center font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-basil sm:text-3xl">
            Norza<span className="text-tomato">Mart</span>
          </Link>

          <nav aria-label="Primary storefront navigation" className="order-2 hidden min-h-11 shrink-0 items-center gap-0.5 xl:flex">
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen((open) => !open)}
              aria-expanded={isCategoryMenuOpen}
              aria-controls="storefront-category-menu"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2.5 text-xs font-bold text-ink transition-colors hover:bg-mint-wash hover:text-basil"
            >
              Categories
              <ChevronDownIcon size={14} className={`transition-transform duration-200 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <Link href="/#todays-deals" className="inline-flex min-h-11 items-center rounded-control px-2.5 text-xs font-bold text-ink transition-colors hover:bg-mint-wash hover:text-basil">Deals</Link>
            <Link href="/#latest-products" className="inline-flex min-h-11 items-center rounded-control px-2.5 text-xs font-bold text-ink transition-colors hover:bg-mint-wash hover:text-basil">What&apos;s new</Link>
            <Link href="/#why-norzamart" className="inline-flex min-h-11 items-center rounded-control px-2.5 text-xs font-bold text-ink transition-colors hover:bg-mint-wash hover:text-basil">Delivery</Link>
          </nav>

          <div className="relative order-3 w-full lg:order-2 lg:max-w-2xl lg:flex-1 xl:order-3 xl:max-w-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowSuggestions(false);
                router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
              }}
              role="search"
              className="flex min-h-12 items-center rounded-control border border-line bg-[#f4f7f4] pl-4 pr-1 transition-[box-shadow,background-color] focus-within:bg-white focus-within:ring-3 focus-within:ring-mint-glow/45"
            >
              <label htmlFor="site-search" className="sr-only">Search products and local stores</label>
              <input
                id="site-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search for fresh vegetables, meat, or daily groceries..."
                autoComplete="off"
                className="nm-site-search-input w-full min-w-0 bg-transparent py-3 font-body text-base text-ink placeholder:text-stone focus:outline-none lg:text-sm"
              />
              <button type="submit" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.6rem] text-basil transition-colors hover:bg-mint-wash" aria-label="Search">
                <SearchIcon size={20} />
              </button>
            </form>

            <AnimatePresence>
              {showSuggestions && searchQuery.trim().length < 2 && popularSearches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-card border border-line bg-paper p-4 shadow-float"
                >
                  <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wide mb-2">Popular Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((p) => (
                      <button
                        key={p.term}
                        onMouseDown={() => runSearch(p.term)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-cream-mist px-3 text-xs font-semibold capitalize text-ink transition-colors hover:border-basil/30 hover:bg-mint-wash"
                      >
                        <FlameIcon size={14} className="text-tomato" /> {p.term}
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
                  className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-card border border-line bg-paper shadow-float"
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
                            {s.storeLogo ? <img src={s.storeLogo} alt={s.storeName} className="max-w-full max-h-full object-contain" /> : <StoreIcon size={18} className="text-basil" />}
                          </div>
                          <span className="text-sm font-semibold text-ink truncate flex-1">{s.storeName}</span>
                          {s.status === 'approved' && <CheckBadgeIcon size={17} className="shrink-0 text-basil" />}
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
                            {s.image ? <img src={s.image} alt={s.name} className="max-w-full max-h-full object-contain" /> : <BasketIcon size={18} className="text-basil" />}
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

          <div className="order-2 ml-auto flex items-center gap-1 text-sm font-semibold text-ink sm:gap-2 lg:order-3 xl:order-4">
            {session ? (
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => { if (!isProfileOpen) measureProfilePos(224); setIsProfileOpen(!isProfileOpen); }}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                  className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-paper pl-1.5 pr-2 text-ink transition-colors hover:bg-mint-wash sm:pr-3"
                >
                  <span className="w-7 h-7 rounded-full bg-basil text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    {(session.user as any)?.avatar ? (
                      <img src={(session.user as any).avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (session.user?.name || 'C').charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="hidden md:inline text-ink font-bold text-sm">{session.user?.name || 'Customer'}</span>
                  <ChevronDownIcon size={15} className="text-stone" />
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
                          role="menu"
                          className="fixed z-50 overflow-hidden rounded-card border border-line bg-paper shadow-float"
                        >
                          <Link
                            href="/dashboard"
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-ink hover:bg-basil/5 transition-colors flex items-center gap-2"
                          >
                            <HomeIcon size={18} /> My Dashboard
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-ink hover:bg-basil/5 transition-colors flex items-center gap-2"
                          >
                            <SettingsIcon size={18} /> Account Settings
                          </Link>
                          <div className="h-px bg-ink/10" />
                          <button
                            onClick={handleSellClick}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-ink hover:bg-basil/5 transition-colors flex items-center gap-2"
                          >
                            <StoreIcon size={18} /> Sell on NorzaMart
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
                className="min-h-11 rounded-control px-2 font-semibold text-ink transition-colors hover:bg-mint-wash hover:text-basil sm:px-3"
              >
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">Sign in / Register</span>
              </button>
            )}

            <NotificationBell />

            {session && <HeaderQuickPreviews chatCount={chatCount} />}

            <Link
              href="/cart"
              aria-label={`Basket, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
              className="relative flex h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-basil px-3 text-white shadow-md shadow-basil/20 transition-colors hover:bg-basil-light sm:px-4"
            >
              <BasketIcon size={20} />
              <span className="hidden font-mono text-xs font-bold sm:inline">{cartCount}</span>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-tomato px-1 font-mono text-[9px] font-black text-white sm:hidden">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        <nav aria-label="Storefront navigation" className="border-t border-line/80 bg-white xl:hidden">
          <div className="nm-container flex min-h-11 items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen((open) => !open)}
              aria-expanded={isCategoryMenuOpen}
              aria-controls="storefront-category-menu"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control px-3 text-xs font-bold text-ink transition-colors hover:bg-mint-wash hover:text-basil"
            >
              <CategoryGridIcon size={16} className="text-basil" /> Categories
              <ChevronDownIcon size={14} className={`transition-transform duration-200 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {[
              ['Deals', '/#todays-deals'],
              ["What's new", '/#latest-products'],
              ['Delivery', '/#why-norzamart'],
              ['Local stores', '/#local-stores'],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="inline-flex min-h-11 shrink-0 items-center px-3 text-xs font-bold text-ink transition-colors hover:bg-mint-wash hover:text-basil sm:px-4">
                {label}
              </Link>
            ))}
          </div>
        </nav>
        <AnimatePresence>
          {isCategoryMenuOpen && (
            <motion.div
              id="storefront-category-menu"
              initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.995 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
              className="absolute left-0 top-full z-50 w-full border-y border-line bg-white shadow-[0_22px_50px_rgba(24,49,39,0.16)]"
            >
              <div className="nm-container grid gap-5 py-5 md:grid-cols-[1fr_15rem] md:py-6">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-tomato">Popular categories</p>
                      <p className="mt-1 text-sm font-black text-ink">Start with a market aisle</p>
                    </div>
                    <button type="button" onClick={() => setIsCategoryMenuOpen(false)} aria-label="Close categories menu" className="nm-icon-button !h-11 !w-11">
                      <CloseIcon size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-5 sm:grid-cols-3 lg:grid-cols-4">
                    {menuCategories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/?category=${encodeURIComponent(category.name)}`}
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="group flex min-h-14 items-center gap-3 border-b border-line py-2 text-xs font-extrabold text-ink transition-colors hover:text-basil"
                      >
                        <MarketCategoryIcon category={category.name} size={21} className="shrink-0 text-basil transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105" />
                        <span className="min-w-0 truncate">{category.name}</span>
                      </Link>
                    ))}
                    <Link href="/#shop-categories" onClick={() => setIsCategoryMenuOpen(false)} className="inline-flex min-h-14 items-center gap-2 border-b border-line py-2 text-xs font-black text-tomato hover:text-danger">
                      View all categories <ArrowRightIcon size={15} />
                    </Link>
                  </div>
                </div>
                <div className="relative hidden overflow-hidden rounded-[0.85rem] bg-mint-wash p-5 md:block">
                  <span aria-hidden="true" className="absolute -bottom-10 -right-8 h-32 w-32 rounded-full border-[24px] border-basil/8" />
                  <p className="text-[10px] font-black uppercase tracking-[0.11em] text-basil-light">Made nearby</p>
                  <p className="mt-2 font-body text-xl font-black leading-tight tracking-tight text-forest-deep">Discover something local today.</p>
                  <Link href="/search" onClick={() => setIsCategoryMenuOpen(false)} className="relative mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-black text-basil hover:text-tomato">
                    Browse the market <ArrowRightIcon size={15} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
  );
}
