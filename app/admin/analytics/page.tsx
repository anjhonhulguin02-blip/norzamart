"use client";

import React, { useEffect, useState } from 'react';
import MiniBarChart from '@/components/seller/MiniBarChart';

interface AnalyticsData {
  revenueByDay: { label: string; date: string; revenue: number }[];
  topProducts: { name: string; revenue: number; qty: number }[];
  topSellers: { storeName: string; revenue: number; orders: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  ordersByBarangay: { barangay: string; count: number }[];
  statusCounts: Record<string, number>;
  totalRevenue: number;
  totalOrders: number;
  deliveredCount: number;
  avgOrderValue: number;
  totalBuyers: number;
  totalSellers: number;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(async (res) => {
        const text = await res.text();
        const parsed = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(parsed.message || 'Failed to load analytics.');
        setData(parsed);
      })
      .catch((err) => setLoadError(err.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-ink/50 text-sm font-body">Loading analytics…</p>;
  if (!data) return <p className="text-tomato text-sm font-body">{loadError || 'Failed to load analytics.'}</p>;

  const maxCategoryRevenue = Math.max(...data.revenueByCategory.map((c) => c.revenue), 1);
  const maxBarangayCount = Math.max(...data.ordersByBarangay.map((b) => b.count), 1);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Analytics</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Platform-wide performance, based on completed (delivered) orders.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <div className="font-mono text-2xl font-bold text-ink">₱{data.totalRevenue.toFixed(2)}</div>
          <div className="text-ink/50 text-xs font-body mt-1">Total Revenue (Delivered)</div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <div className="font-mono text-2xl font-bold text-ink">{data.totalOrders}</div>
          <div className="text-ink/50 text-xs font-body mt-1">Total Orders ({data.deliveredCount} delivered)</div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <div className="font-mono text-2xl font-bold text-ink">₱{data.avgOrderValue.toFixed(2)}</div>
          <div className="text-ink/50 text-xs font-body mt-1">Avg. Order Value</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-basil mb-4">Revenue — Last 7 Days</h2>
          <MiniBarChart data={data.revenueByDay} />
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-basil mb-4">Order Status Breakdown</h2>
          {Object.keys(data.statusCounts).length === 0 ? (
            <p className="text-ink/50 text-sm font-body">No orders yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.entries(data.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-ink/70 capitalize">{status.replace('_', ' ')}</span>
                  <span className="font-mono font-bold text-ink">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-basil mb-4">🏆 Top Products</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-ink/50 text-sm font-body">No sales data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-ink/40 text-xs">{p.qty} sold</p>
                  </div>
                  <p className="font-mono text-sm font-bold text-basil">₱{p.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-basil mb-4">🏬 Top Sellers</h2>
          {data.topSellers.length === 0 ? (
            <p className="text-ink/50 text-sm font-body">No sales data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.topSellers.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{s.storeName}</p>
                    <p className="text-ink/40 text-xs">{s.orders} order{s.orders !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="font-mono text-sm font-bold text-basil">₱{s.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-basil mb-4">🗂️ Revenue by Category</h2>
          {data.revenueByCategory.length === 0 ? (
            <p className="text-ink/50 text-sm font-body">No sales data yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.revenueByCategory.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-ink/70">{c.category}</span>
                    <span className="font-mono font-bold text-ink">₱{c.revenue.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-ink/5 rounded-full h-2 overflow-hidden">
                    <div className="bg-basil h-full rounded-full transition-all duration-500"
                      style={{ width: `${(c.revenue / maxCategoryRevenue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-basil mb-4">📍 Orders by Barangay</h2>
          {data.ordersByBarangay.length === 0 ? (
            <p className="text-ink/50 text-sm font-body">No orders yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.ordersByBarangay.map((b) => (
                <div key={b.barangay}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-ink/70">{b.barangay}</span>
                    <span className="font-mono font-bold text-ink">{b.count}</span>
                  </div>
                  <div className="w-full bg-ink/5 rounded-full h-2 overflow-hidden">
                    <div className="bg-tomato h-full rounded-full transition-all duration-500"
                      style={{ width: `${(b.count / maxBarangayCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
