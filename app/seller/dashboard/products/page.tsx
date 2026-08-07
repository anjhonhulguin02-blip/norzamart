"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image?: string;
  stock: number;
  status: string;
}

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const fetchProducts = async () => {
    const res = await fetch("/api/seller/products");
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const toggleStatus = async (product: Product) => {
    const nextStatus = product.status === "active" ? "inactive" : "active";
    await fetch(`/api/seller/products/${product._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setProducts((prev) =>
      prev.map((p) => (p._id === product._id ? { ...p, status: nextStatus } : p))
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-basil">My Products</h1>
          <p className="text-ink/60 text-sm font-body mt-1">Manage everything you're selling.</p>
        </div>
        <Link
          href="/seller/dashboard/products/add"
          className="bg-basil hover:bg-basil-light text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
        >
          + Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading products…</p>
      ) : products.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg mt-6">
          <span className="text-4xl mb-3 block">🛒</span>
          <p className="text-ink/50 text-sm font-body mb-4">You haven't listed any products yet.</p>
          <Link
            href="/seller/dashboard/products/add"
            className="inline-block bg-basil hover:bg-basil-light text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            Add your first product →
          </Link>
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {products.map((p, i) => (
            <div
              key={p._id}
              className={`flex items-center gap-4 p-4 ${
                i !== products.length - 1 ? "border-b border-ink/5" : ""
              }`}
            >
              <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-ink/10">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-xl">🛒</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/seller/dashboard/products/edit/${p._id}`}
                  className="text-sm font-bold text-ink hover:text-basil transition-colors truncate block"
                >
                  {p.name}
                </Link>
                <p className="text-ink/40 text-xs">{p.category}</p>
              </div>

              <div className="text-right">
                <p className="text-sm font-mono font-bold text-basil">₱{p.price.toFixed(2)}</p>
                {p.originalPrice && (
                  <p className="text-[10px] text-ink/30 line-through">₱{p.originalPrice.toFixed(2)}</p>
                )}
              </div>

              <span
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg ${
                  p.stock === 0 ? "bg-tomato/10 text-tomato" : p.stock <= 5 ? "bg-yellow-100 text-yellow-700" : "bg-basil/10 text-basil"
                }`}
              >
                {p.stock} in stock
              </span>

              <button
                onClick={() => toggleStatus(p)}
                className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full transition-all ${
                  p.status === "active" ? "bg-basil/10 text-basil hover:bg-basil/20" : "bg-ink/10 text-ink/50 hover:bg-ink/20"
                }`}
              >
                {p.status === "active" ? "Active" : "Inactive"}
              </button>

              <Link
                href={`/seller/dashboard/products/edit/${p._id}`}
                className="text-xs font-bold text-ink/50 hover:text-basil px-2 transition-colors"
              >
                Edit
              </Link>

              <button
                onClick={() => setDeleteTarget(p)}
                className="text-xs font-bold text-tomato/70 hover:text-tomato px-2 transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        title="Delete product?"
        message={`"${deleteTarget?.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget._id)}
      />
    </div>
  );
}
