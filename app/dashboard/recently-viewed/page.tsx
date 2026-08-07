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

export default function RecentlyViewedPage() {
  const [products, setProducts] = useState<RVProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const ids = JSON.parse(localStorage.getItem('recently_viewed') || '[]') as string[];
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

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Recently Viewed</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Products you've checked out recently, on this device.</p>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-8">Loading…</p>
      ) : products.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-8">
          <span className="text-4xl mb-3 block">🕓</span>
          <p className="text-ink/50 text-sm font-body">Products you view will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mt-8">
          {products.map((p) => (
            <Link
              key={p._id}
              href={`/product/${p._id}`}
              className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-full h-32 bg-white rounded-xl flex items-center justify-center overflow-hidden mb-3">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-4xl">🛒</span>
                )}
              </div>
              <h3 className="font-body font-bold text-sm text-ink line-clamp-1">{p.name}</h3>
              <p className="font-mono text-sm font-bold text-ink mt-1">₱{p.price} <span className="text-ink/40 text-xs">/{p.unit}</span></p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}