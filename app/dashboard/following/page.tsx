"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import FollowButton from '@/components/FollowButton';

interface Store {
  sellerId: string;
  storeName: string;
  storeLogo?: string;
  barangay: string;
  status: string;
  productCount: number;
}

export default function FollowingPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/follow')
      .then((res) => res.json())
      .then((data) => setStores(data.stores || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Following</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Local stores you follow, in one place.</p>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-8">Loading…</p>
      ) : stores.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-8">
          <span className="text-4xl mb-3 block">🏬</span>
          <p className="text-ink/50 text-sm font-body">You're not following any stores yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-8">
          {stores.map((s) => (
            <div key={s.sellerId} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm">
              <Link href={`/seller/${s.sellerId}`} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-basil/10 flex items-center justify-center overflow-hidden shrink-0">
                  {s.storeLogo ? (
                    <img src={s.storeLogo} alt={s.storeName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🏬</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-sm text-ink truncate">{s.storeName}</p>
                    {s.status === 'approved' && <span title="Verified Seller" className="text-basil text-xs shrink-0">✔️</span>}
                  </div>
                  <p className="text-ink/50 text-xs font-body">📍 {s.barangay} · {s.productCount} products</p>
                </div>
              </Link>
              <div className="mt-4">
                <FollowButton
                  sellerId={s.sellerId}
                  initialFollowerCount={0}
                  showCount={false}
                  onToggle={(following) => {
                    if (!following) setStores((prev) => prev.filter((store) => store.sellerId !== s.sellerId));
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
