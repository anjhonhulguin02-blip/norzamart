"use client";

import React, { useEffect, useState } from 'react';
import OrderStatusBadge from '@/components/OrderStatusBadge';

interface Order {
  _id: string;
  buyer: { name: string };
  seller: { storeName: string };
  total: number;
  status: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/orders').then((res) => res.json()).then((d) => setOrders(d.orders || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Orders</h1>
      <p className="text-ink/60 text-sm font-body mt-1">All orders across the platform (latest 100).</p>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {orders.map((o, i) => (
            <div key={o._id} className={`flex items-center justify-between p-4 ${i !== orders.length - 1 ? 'border-b border-ink/5' : ''}`}>
              <div>
                <p className="text-sm font-bold text-ink">{o.buyer?.name} → {o.seller?.storeName}</p>
                <p className="text-ink/40 text-[11px]">{new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-ink">₱{o.total.toFixed(2)}</span>
                <OrderStatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}