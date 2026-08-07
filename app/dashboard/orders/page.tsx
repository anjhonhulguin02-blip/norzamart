"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import OrderStatusBadge from '@/components/OrderStatusBadge';

interface Order {
  _id: string;
  seller: { storeName: string; storeLogo?: string };
  items: { name: string; quantity: number }[];
  total: number;
  status: string;
  createdAt: string;
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">My Orders</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Track your purchases from local sellers.</p>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-8">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-8">
          <span className="text-4xl mb-3 block">📦</span>
          <h2 className="font-display text-xl font-semibold text-basil mb-1">No orders yet</h2>
          <p className="text-ink/50 text-sm font-body mb-5">Your order history will appear here.</p>
          <Link href="/" className="inline-block bg-basil hover:bg-basil-light text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-8">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/dashboard/orders/${order._id}`}
              className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-basil/10 flex items-center justify-center overflow-hidden shrink-0">
                {order.seller.storeLogo ? (
                  <img src={order.seller.storeLogo} alt={order.seller.storeName} className="w-full h-full object-cover" />
                ) : <span className="text-lg">🏬</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-ink truncate">{order.seller.storeName}</p>
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