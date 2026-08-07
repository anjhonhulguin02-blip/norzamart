"use client";

import React, { useEffect, useState } from 'react';

interface Coupon {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minSpend: number;
  maxDiscount?: number;
  expiresAt?: string;
}

export default function BuyerCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    fetch('/api/coupons')
      .then((res) => res.json())
      .then((data) => setCoupons(data.coupons || []))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Coupons</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Available promo codes you can use at checkout.</p>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : coupons.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-6">
          <span className="text-4xl mb-3 block">🎟️</span>
          <p className="text-ink/50 text-sm font-body">No active promo codes right now. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {coupons.map((c) => (
            <div key={c._id} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono font-black text-lg text-basil tracking-wide">{c.code}</p>
                  <p className="text-ink/70 text-sm font-body mt-1">
                    {c.type === 'percent' ? `${c.value}% off` : `₱${c.value.toFixed(2)} off`}
                    {c.maxDiscount && c.type === 'percent' ? ` (up to ₱${c.maxDiscount.toFixed(2)})` : ''}
                  </p>
                  {c.minSpend > 0 && (
                    <p className="text-ink/40 text-xs font-body mt-0.5">Min. spend ₱{c.minSpend.toFixed(2)}</p>
                  )}
                  {c.expiresAt && (
                    <p className="text-ink/40 text-xs font-body mt-0.5">
                      Expires {new Date(c.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => copyCode(c.code)}
                  className="bg-basil/10 hover:bg-basil/20 text-basil text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0"
                >
                  {copiedCode === c.code ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
