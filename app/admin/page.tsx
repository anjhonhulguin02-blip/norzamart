"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  userCount: number;
  sellerCount: number;
  pendingSellerCount: number;
  productCount: number;
  orderCount: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then((res) => res.json()).then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-ink/50 text-sm font-body">Loading…</p>;
  if (!stats) return <p className="text-tomato text-sm font-body">Failed to load stats.</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Admin Dashboard</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Platform-wide overview.</p>

      {stats.pendingSellerCount > 0 && (
        <Link href="/admin/sellers" className="block mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 hover:bg-yellow-100 transition-all">
          <p className="text-yellow-700 text-sm font-bold">
            🕓 {stats.pendingSellerCount} seller{stats.pendingSellerCount > 1 ? 's' : ''} awaiting verification →
          </p>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
        {[
          ['Total Users', stats.userCount],
          ['Total Sellers', stats.sellerCount],
          ['Total Products', stats.productCount],
          ['Total Orders', stats.orderCount],
          ['Platform Revenue', `₱${stats.totalRevenue.toFixed(2)}`],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
            <div className="font-mono text-2xl font-bold text-ink">{value}</div>
            <div className="text-ink/50 text-xs font-body mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}