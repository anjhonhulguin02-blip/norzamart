"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
  { label: 'Sellers', href: '/admin/sellers', icon: '🏬' },
  { label: 'Products', href: '/admin/products', icon: '📦' },
  { label: 'Orders', href: '/admin/orders', icon: '🧾' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { label: 'Categories', href: '/admin/categories', icon: '🗂️' },
  { label: 'Barangays', href: '/admin/barangays', icon: '📍' },
  { label: 'Coupons', href: '/admin/coupons', icon: '🎟️' },
  { label: 'Subscribers', href: '/admin/subscribers', icon: '📧' },
  { label: 'Payouts', href: '/admin/payouts', icon: '💰' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-ink text-white min-h-screen p-5 hidden md:flex md:flex-col">
      <Link href="/" className="font-display text-xl font-semibold mb-8">
        Norza<span className="text-tomato">Mart</span> <span className="text-white/40 text-xs font-body font-normal">Admin</span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active ? 'bg-basil text-white' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-tomato hover:bg-white/10 transition-all mt-4"
      >
        🚪 Logout
      </button>
    </aside>
  );
}