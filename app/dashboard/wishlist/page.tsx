"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    unit: string;
    image?: string;
    stock: number;
    seller?: { storeName: string; barangay: string };
  };
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchWishlist = async () => {
    const res = await fetch('/api/wishlist');
    const data = await res.json();
    setItems((data.items || []).filter((i: WishlistItem) => i.product));
    setLoading(false);
  };

  useEffect(() => { fetchWishlist(); }, []);

  const removeItem = async (productId: string, itemId: string) => {
    setRemovingId(itemId);
    await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    setItems((prev) => prev.filter((i) => i._id !== itemId));
    setRemovingId(null);
  };

  const addToCart = async (productId: string) => {
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Wishlist</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Products you've saved for later.</p>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-8">Loading your wishlist…</p>
      ) : items.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-8">
          <span className="text-4xl mb-3 block">♡</span>
          <h2 className="font-display text-xl font-semibold text-basil mb-1">Your wishlist is empty</h2>
          <p className="text-ink/50 text-sm font-body mb-5">Tap the heart icon on any product to save it here.</p>
          <Link href="/" className="inline-block bg-basil hover:bg-basil-light text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-8">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 shadow-sm"
              >
                <Link href={`/product/${item.product._id}`} className="block">
                  <div className="w-full h-32 bg-white rounded-xl flex items-center justify-center overflow-hidden mb-3">
                    {item.product.image ? (
                      <img src={item.product.image} alt={item.product.name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-4xl">🛒</span>
                    )}
                  </div>
                  <h3 className="font-body font-bold text-sm text-ink line-clamp-1">{item.product.name}</h3>
                  <p className="text-ink/50 text-xs font-body mt-0.5">{item.product.seller?.storeName}</p>
                  <p className="font-mono text-sm font-bold text-ink mt-1">
                    ₱{item.product.price} <span className="text-ink/40 text-xs">/{item.product.unit}</span>
                  </p>
                </Link>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => addToCart(item.product._id)}
                    disabled={item.product.stock === 0}
                    className="flex-1 bg-basil hover:bg-basil-light disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-all"
                  >
                    Add to Basket
                  </button>
                  <button
                    onClick={() => removeItem(item.product._id, item._id)}
                    disabled={removingId === item._id}
                    className="flex-1 bg-tomato/10 hover:bg-tomato/20 text-tomato text-xs font-bold py-2 rounded-lg transition-all disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}