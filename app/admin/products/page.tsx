"use client";

import React, { useEffect, useState } from 'react';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  seller?: { storeName: string };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    const res = await fetch('/api/admin/products');
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setUpdatingId(id);
    await fetch(`/api/admin/products/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p)));
    setUpdatingId(null);
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Products</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Moderate listings across all sellers.</p>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {products.map((p, i) => (
            <div key={p._id} className={`flex items-center justify-between p-4 ${i !== products.length - 1 ? 'border-b border-ink/5' : ''}`}>
              <div>
                <p className="text-sm font-bold text-ink">{p.name}</p>
                <p className="text-ink/50 text-xs">{p.seller?.storeName} • {p.category} • ₱{p.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  p.status === 'active' ? 'bg-basil/15 text-basil' : 'bg-tomato/15 text-tomato'
                }`}>{p.status}</span>
                <button
                  onClick={() => toggleStatus(p._id, p.status)}
                  disabled={updatingId === p._id}
                  className="bg-ink/5 hover:bg-ink/10 text-ink text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  {p.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}