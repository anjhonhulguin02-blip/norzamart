"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { label: 'My Orders', href: '/dashboard/orders', icon: '📦' },
  { label: 'Addresses', href: '/dashboard/addresses', icon: '📍' },
  { label: 'Wishlist', href: '/dashboard/wishlist', icon: '♡' },
  { label: 'Following', href: '/dashboard/following', icon: '🏬' },
  { label: 'Recently Viewed', href: '/dashboard/recently-viewed', icon: '🕓' },
  { label: 'Notifications', href: '/dashboard/notifications', icon: '🔔' },
  { label: 'Coupons', href: '/dashboard/coupons', icon: '🎟️' },
];

// Mobile menu shows Account Settings inline rather than as a visually separated item.
export const buyerNavItems = [...navItems, { label: 'Account Settings', href: '/profile', icon: '⚙️' }];

export default function BuyerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-white/70 backdrop-blur-xl border-r border-white/60 min-h-screen p-5 hidden md:flex md:flex-col">
      <Link href="/" className="font-display text-xl font-semibold text-basil mb-8">
        Norza<span className="text-tomato">Mart</span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active ? 'bg-basil text-white shadow-md shadow-basil/20' : 'text-ink/70 hover:bg-basil/5'
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          );
        })}
        <div className="h-px bg-ink/10 my-2" />
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-ink/70 hover:bg-basil/5 transition-all"
        >
          ⚙️ Account Settings
        </Link>
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-tomato hover:bg-tomato/5 transition-all mt-4"
      >
        🚪 Logout
      </button>
    </aside>
  );
}