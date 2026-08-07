"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  _id: string;
  name: string;
  category: string;
  stock: number;
  status: string;
  image?: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const fetchProducts = async () => {
    const res = await fetch('/api/seller/products');
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setEditValue(String(product.stock));
  };

  const saveStock = async (id: string) => {
    const stock = Number(editValue);
    if (isNaN(stock) || stock < 0) return;

    setSaving(true);
    await fetch(`/api/seller/products/${id}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    });
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, stock } : p)));
    setEditingId(null);
    setSaving(false);
  };

  const filtered = products.filter((p) => {
    if (filter === 'low') return p.stock > 0 && p.stock <= 5;
    if (filter === 'out') return p.stock === 0;
    return true;
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Inventory</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Quickly check and adjust stock levels.</p>

      <div className="flex gap-2 mt-5">
        {[
          { key: 'all', label: 'All Products' },
          { key: 'low', label: '⚠️ Low Stock' },
          { key: 'out', label: '✕ Out of Stock' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === f.key ? 'bg-basil text-white' : 'bg-white/60 text-ink/60 hover:bg-basil/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading inventory…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-6">
          <span className="text-4xl mb-3 block">📦</span>
          <p className="text-ink/50 text-sm font-body">No products in this filter.</p>
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {filtered.map((p, i) => (
            <div
              key={p._id}
              className={`flex items-center gap-4 p-4 ${i !== filtered.length - 1 ? 'border-b border-ink/5' : ''}`}
            >
              <div className="w-11 h-11 bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-ink/10">
                {p.image ? <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" /> : <span className="text-lg">🛒</span>}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/seller/dashboard/products/edit/${p._id}`} className="text-sm font-bold text-ink hover:text-basil transition-colors truncate block">
                  {p.name}
                </Link>
                <p className="text-ink/40 text-xs">{p.category}</p>
              </div>

              {editingId === p._id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className="w-20 bg-white border border-basil/40 rounded-lg px-2 py-1.5 text-sm font-mono text-center focus:outline-none"
                  />
                  <button
                    onClick={() => saveStock(p._id)}
                    disabled={saving}
                    className="bg-basil text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-basil-light disabled:opacity-50 transition-all"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-ink/40 text-xs font-bold px-2 hover:text-ink"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(p)}
                  className={`text-sm font-mono font-bold px-3 py-1.5 rounded-lg transition-all ${
                    p.stock === 0 ? 'bg-tomato/10 text-tomato' : p.stock <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-basil/10 text-basil'
                  }`}
                >
                  {p.stock} in stock
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}