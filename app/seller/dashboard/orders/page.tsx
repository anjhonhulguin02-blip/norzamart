"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import OrderStatusBadge from '@/components/OrderStatusBadge';

interface Order {
  _id: string;
  buyer: { name: string };
  items: { name: string; quantity: number }[];
  total: number;
  status: string;
  createdAt: string;
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/seller/orders');
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    };
    load();
  }, []);

  const pendingRequestCount = orders.filter((o) => o.status === 'cancellation_requested' || o.status === 'refund_requested').length;

  const filtered = filter === 'all'
    ? orders
    : filter === 'requests'
    ? orders.filter((o) => o.status === 'cancellation_requested' || o.status === 'refund_requested')
    : orders.filter((o) => o.status === filter);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Orders</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Manage incoming orders from customers.</p>

      <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
        {['all', 'requests', 'pending', 'accepted', 'preparing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === f ? 'bg-basil text-white' : 'bg-white/60 text-ink/60 hover:bg-basil/5'
            }`}
          >
            {f === 'all' ? 'All' : f === 'requests' ? `Requests${pendingRequestCount > 0 ? ` (${pendingRequestCount})` : ''}` : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading orders…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-6">
          <span className="text-4xl mb-3 block">📦</span>
          <p className="text-ink/50 text-sm font-body">No orders in this category.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-6">
          {filtered.map((order) => (
            <Link
              key={order._id}
              href={`/seller/dashboard/orders/${order._id}`}
              className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-ink truncate">{order.buyer?.name}</p>
                <p className="text-ink/50 text-xs font-body truncate">
                  {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                </p>
                <p className="text-ink/40 text-[11px] mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-bold text-ink text-sm">₱{order.total.toFixed(2)}</p>
                <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}