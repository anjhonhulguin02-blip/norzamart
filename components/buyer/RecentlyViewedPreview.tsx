"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface RVProduct {
  _id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
}

export default function RecentlyViewedPreview() {
  const [products, setProducts] = useState<RVProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const ids = (JSON.parse(localStorage.getItem('recently_viewed') || '[]') as string[]).slice(0, 4);
        if (ids.length === 0) {
          setLoading(false);
          return;
        }
        const res = await fetch('/api/products/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        const map = new Map((data.products || []).map((p: any) => [p._id, p]));
        const ordered = ids.map((id) => map.get(id)).filter(Boolean);
        setProducts(ordered as RVProduct[]);
      } catch {
        // ignore
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-basil">🕓 Recently Viewed</h2>
        <Link href="/dashboard/recently-viewed" className="text-xs font-bold text-basil hover:underline">View all →</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {products.map((p) => (
          <Link
            key={p._id}
            href={`/product/${p._id}`}
            className="bg-white/60 border border-white/70 rounded-xl p-3 hover:shadow-md transition-all"
          >
            <div className="w-full h-24 bg-white rounded-lg flex items-center justify-center overflow-hidden mb-2">
              {p.image ? (
                <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-3xl">🛒</span>
              )}
            </div>
            <p className="font-body font-bold text-xs text-ink line-clamp-1">{p.name}</p>
            <p className="font-mono text-xs font-bold text-ink mt-0.5">₱{p.price} <span className="text-ink/40">/{p.unit}</span></p>
          </Link>
        ))}
      </div>
    </div>
  );
}
