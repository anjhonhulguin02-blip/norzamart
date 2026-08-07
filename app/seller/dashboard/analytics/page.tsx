"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MiniBarChart from '@/components/seller/MiniBarChart';

interface AnalyticsData {
  revenueByDay: { label: string; date: string; revenue: number }[];
  topProducts: { name: string; revenue: number; qty: number }[];
  statusCounts: Record<string, number>;
  lowStockProducts: { _id: string; name: string; stock: number; image?: string }[];
  totalRevenue: number;
  totalOrders: number;
  deliveredCount: number;
  avgOrderValue: number;
}

export default function SellerAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetch('/api/seller/analytics')
      .then(async (res) => {
        const text = await res.text();
        const parsed = text ? JSON.parse(text) : {};
        if (!res.ok) {
          throw new Error(parsed.message || 'Failed to load analytics.');
        }
        setData(parsed);
      })
      .catch((err) => setLoadError(err.message || 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-ink/50 text-sm font-body">Loading analytics…</p>;
  if (!data) return <p className="text-tomato text-sm font-body">{loadError || 'Failed to load analytics.'}</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Analytics</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Based on completed (delivered) orders.</p>

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
          <h2 className="font-display text-lg font-semibold text-tomato mb-4">⚠️ Low Stock Alerts</h2>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-ink/50 text-sm font-body">All products are well-stocked.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.lowStockProducts.map((p) => (
                <Link
                  key={p._id}
                  href={`/seller/dashboard/products/edit/${p._id}`}
                  className="flex items-center gap-3 hover:bg-tomato/5 rounded-lg p-1.5 -m-1.5 transition-all"
                >
                  <div className="w-8 h-8 bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-ink/10">
                    {p.image ? <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" /> : <span className="text-sm">🛒</span>}
                  </div>
                  <p className="text-sm font-semibold text-ink flex-1 truncate">{p.name}</p>
                  <span className="text-tomato text-xs font-bold">{p.stock} left</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}