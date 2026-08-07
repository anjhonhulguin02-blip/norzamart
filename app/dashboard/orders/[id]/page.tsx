"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import OrderTimeline from '@/components/OrderTimeline';
import Modal from '@/components/ui/Modal';

interface OrderDetail {
  _id: string;
  seller: { _id: string; storeName: string; storeLogo?: string };
  items: { product: string; name: string; price: number; quantity: number; unit: string; image?: string }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  statusHistory: { status: string; at: string }[];
  paymentMethod: string;
  deliveryAddress: string;
  deliveryBarangay: string;
  createdAt: string;
}

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchOrder = async () => {
    const res = await fetch(`/api/orders/${id}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    setError('');
    const res = await fetch(`/api/orders/${id}/cancel`, { method: 'PUT' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || 'Something went wrong.');
    } else {
      fetchOrder();
    }
    setCancelling(false);
  };

  if (loading) return <p className="text-ink/50 text-sm font-body">Loading order…</p>;
  if (!order) return <p className="text-tomato text-sm font-body">Order not found.</p>;

  return (
    <div>
      <button onClick={() => router.push('/dashboard/orders')} className="text-ink/50 text-xs font-bold mb-4 hover:text-basil transition-colors">
        ← Back to Orders
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-basil">Order Details</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-basil/10 flex items-center justify-center overflow-hidden shrink-0">
                {order.seller.storeLogo ? (
                  <img src={order.seller.storeLogo} alt={order.seller.storeName} className="w-full h-full object-cover" />
                ) : <span className="text-lg">🏬</span>}
              </div>
              <Link href={`/seller/${order.seller._id}`} className="font-bold text-sm text-ink hover:text-basil transition-colors">
                {order.seller.storeName} →
              </Link>
            </div>

            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-ink/5 last:border-0">
                <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                  {item.image ? <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" /> : <span className="text-lg">🛒</span>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-ink/50 text-xs">₱{item.price} × {item.quantity} {item.unit}</p>
                </div>
                <p className="font-mono text-sm font-bold text-ink">₱{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}

            <div className="border-t border-ink/10 mt-3 pt-3 flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-ink/70"><span>Subtotal</span><span className="font-mono">₱{order.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-ink/70"><span>Delivery</span><span className="font-mono">₱{order.deliveryFee.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-ink"><span>Total</span><span className="font-mono">₱{order.total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-basil mb-2">📍 Delivery Info</h2>
            <p className="text-sm text-ink/80">{order.deliveryAddress}</p>
            <p className="text-sm text-ink/50">{order.deliveryBarangay}</p>
            <p className="text-ink/50 text-xs mt-2">Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'gcash' ? 'GCash' : 'Bank Transfer'}</p>
          </div>

          {order.status === 'pending' && (
            <div>
              {error && <p className="text-tomato text-xs font-semibold mb-2">{error}</p>}
              <button onClick={() => setShowCancelModal(true)} disabled={cancelling}
                className="bg-tomato/10 hover:bg-tomato/20 disabled:opacity-50 text-tomato font-bold text-xs px-5 py-2.5 rounded-lg transition-all">
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm h-max">
          <h2 className="font-display text-lg font-semibold text-basil mb-4">Order Status</h2>
          <OrderTimeline status={order.status} statusHistory={order.statusHistory} />
        </div>
      </div>

      <Modal
        open={showCancelModal}
        title="Cancel this order?"
        message="The seller will be notified and this cannot be undone."
        confirmLabel="Cancel Order"
        danger
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
      />
    </div>
  );
}