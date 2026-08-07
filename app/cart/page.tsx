"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

interface CartItem {
  _id: string;
  quantity: number;
  product: {
    _id: string;
    name: string;
    price: number;
    unit: string;
    image?: string;
    stock: number;
    seller?: { storeName: string; barangay: string };
  };
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const fetchCart = async () => {
    const res = await fetch('/api/cart');
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
    const savedCode = localStorage.getItem('norzamart_coupon');
    if (savedCode) setCouponInput(savedCode);
  }, []);

  const updateQuantity = async (itemId: string, quantity: number) => {
    setUpdatingId(itemId);
    await fetch(`/api/cart/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    await fetchCart();
    setUpdatingId(null);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = async (itemId: string) => {
    setUpdatingId(itemId);
    await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
    await fetchCart();
    setUpdatingId(null);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const applyCoupon = async (code: string) => {
    if (!code.trim() || total === 0) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: total }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.message || 'Invalid coupon.');
        setAppliedCoupon(null);
        localStorage.removeItem('norzamart_coupon');
        setCouponLoading(false);
        return;
      }
      setAppliedCoupon({ code: data.code, discount: data.discount });
      localStorage.setItem('norzamart_coupon', data.code);
    } catch {
      setCouponError('Unable to connect to the server.');
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    localStorage.removeItem('norzamart_coupon');
  };

  // Re-validate a coupon restored from localStorage once the cart total is known.
  useEffect(() => {
    if (couponInput && !appliedCoupon && total > 0 && !loading) {
      applyCoupon(couponInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, total]);

  const deliveryFee = total >= 500 ? 0 : (total > 0 ? 50 : 0);
  const discount = appliedCoupon?.discount || 0;
  const grandTotal = Math.max(total + deliveryFee - discount, 0);

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-semibold text-basil mb-6">Your Basket</h1>

        {loading ? (
          <p className="text-ink/50 text-sm font-body">Loading your basket…</p>
        ) : items.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg">
            <span className="text-5xl mb-4 block">🛒</span>
            <h2 className="font-display text-xl font-semibold text-basil mb-1">Your basket is empty</h2>
            <p className="text-ink/50 text-sm font-body mb-5">Browse products and add something fresh.</p>
            <Link href="/" className="inline-block bg-basil hover:bg-basil-light text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 flex gap-4 shadow-sm"
                  >
                    <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-3xl">🛒</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <Link href={`/product/${item.product._id}`} className="font-body font-bold text-sm text-ink hover:text-basil transition-colors">
                        {item.product.name}
                      </Link>
                      <p className="text-ink/50 text-xs font-body mt-0.5">{item.product.seller?.storeName}</p>
                      <p className="font-mono text-sm font-bold text-ink mt-1">
                        ₱{item.product.price} <span className="text-ink/40 text-xs font-body">/{item.product.unit}</span>
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          disabled={updatingId === item._id}
                          className="w-7 h-7 rounded-full bg-white border border-ink/10 font-bold text-ink hover:bg-basil/5 disabled:opacity-40 transition-all text-sm"
                        >
                          −
                        </button>
                        <span className="font-mono text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, Math.min(item.quantity + 1, item.product.stock))}
                          disabled={updatingId === item._id || item.quantity >= item.product.stock}
                          className="w-7 h-7 rounded-full bg-white border border-ink/10 font-bold text-ink hover:bg-basil/5 disabled:opacity-40 transition-all text-sm"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item._id)}
                          disabled={updatingId === item._id}
                          className="text-tomato text-xs font-bold ml-2 hover:underline disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="font-mono font-bold text-ink text-sm">
                      ₱{(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm h-max">
              <h2 className="font-display text-lg font-semibold text-basil mb-4">Order Summary</h2>

              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-basil/10 border border-basil/20 rounded-xl px-3 py-2.5">
                    <p className="text-xs font-bold text-basil">🎟️ {appliedCoupon.code} applied</p>
                    <button onClick={removeCoupon} className="text-[11px] font-bold text-tomato hover:underline">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="flex-1 bg-white border border-ink/10 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-basil/40"
                    />
                    <button
                      onClick={() => applyCoupon(couponInput)}
                      disabled={couponLoading || !couponInput.trim()}
                      className="bg-ink/5 hover:bg-basil/10 disabled:opacity-50 text-ink font-bold text-xs px-4 rounded-xl transition-all"
                    >
                      {couponLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p className="text-tomato text-[11px] font-semibold mt-1.5">{couponError}</p>}
              </div>

              <div className="flex justify-between text-sm text-ink/70 font-body mb-2">
                <span>Subtotal</span>
                <span className="font-mono">₱{total.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-basil font-body mb-2">
                  <span>Discount</span>
                  <span className="font-mono">−₱{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-ink/70 font-body mb-4">
                <span>Delivery</span>
                <span className="font-mono">{deliveryFee === 0 ? 'Free' : `₱${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-ink/10 pt-4 flex justify-between font-bold text-ink mb-5">
                <span>Total</span>
                <span className="font-mono">₱{grandTotal.toFixed(2)}</span>
              </div>
              <Link href="/checkout" className="w-full block text-center bg-basil hover:bg-basil-light text-white font-bold py-3 rounded-xl shadow-md shadow-basil/20 text-sm transition-all">
                Proceed to Checkout →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}