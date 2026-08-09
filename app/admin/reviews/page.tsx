"use client";

import React, { useEffect, useState } from 'react';

interface Review {
  _id: string;
  product: { _id: string; name: string } | null;
  userName: string;
  rating: number;
  comment?: string;
  verifiedPurchase?: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState('');

  const load = async () => {
    const res = await fetch('/api/admin/reviews');
    const data = await res.json();
    setReviews(data.reviews || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this review permanently?')) return;
    setRemovingId(id);
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r._id !== id));
    }
    setRemovingId('');
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Reviews</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Moderate reviews across the platform (latest 200).</p>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="text-ink/50 text-sm font-body mt-6">No reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-3 mt-6">
          {reviews.map((r) => (
            <div key={r._id} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-ink">{r.userName}</span>
                    {r.verifiedPurchase && (
                      <span className="text-basil text-[10px] font-bold bg-basil/10 px-1.5 py-0.5 rounded-full">✔️ Verified</span>
                    )}
                    <span className="text-yellow-500 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <p className="text-ink/40 text-xs mt-0.5">on {r.product?.name || 'a deleted product'}</p>
                  {r.comment && <p className="text-ink/70 text-sm font-body mt-1.5">{r.comment}</p>}
                  <p className="text-ink/40 text-[11px] mt-1.5">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleRemove(r._id)}
                  disabled={removingId === r._id}
                  className="shrink-0 bg-tomato/10 hover:bg-tomato/20 disabled:opacity-50 text-tomato font-bold text-xs px-3.5 py-2 rounded-lg transition-all"
                >
                  {removingId === r._id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
