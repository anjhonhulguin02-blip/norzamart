"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const navItems = [
  { label: 'Dashboard', href: '/seller/dashboard', icon: '📊' },
  { label: 'Products', href: '/seller/dashboard/products', icon: '📦' },
  { label: 'Orders', href: '/seller/dashboard/orders', icon: '🧾' },
  { label: 'Inventory', href: '/seller/dashboard/inventory', icon: '🗃️' },
  { label: 'Analytics', href: '/seller/dashboard/analytics', icon: '📈' },
  { label: 'Messages', href: '/seller/dashboard/messages', icon: '💬' },
  { label: 'Withdraw Earnings', href: '/seller/dashboard/payouts', icon: '💰' },
  { label: 'Store Settings', href: '/seller/dashboard/settings', icon: '⚙️' },
  { label: 'Add Product', href: '/seller/dashboard/products/add', icon: '➕' },
];

export default function SellerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-white/70 backdrop-blur-xl border-r border-white/60 min-h-screen p-5 hidden md:flex md:flex-col">
      <Link href="/" className="font-display text-xl font-semibold text-basil mb-8">
        Norza<span className="text-tomato">Mart</span> <span className="text-ink/40 text-xs font-body font-normal">Seller</span>
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