"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductGrid from '@/components/ProductGrid';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get('q') || '';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ _id: string; name: string; icon: string }[]>([]);
  const [barangays, setBarangays] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/categories').then((res) => res.json()).then((data) => setCategories(data.categories || []));
    fetch('/api/barangays').then((res) => res.json()).then((data) => setBarangays(data.barangays || []));
  }, []);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    barangay: searchParams.get('barangay') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    sort: searchParams.get('sort') || 'newest',
  });

  const fetchResults = async (params: URLSearchParams, cancelledRef: { current: boolean }) => {
    setLoading(true);
    const res = await fetch(`/api/products/filter?${params.toString()}`);
    const data = await res.json();
    if (cancelledRef.current) return;
    setProducts(data.products || []);
    setLoading(false);
  };

  // Rebuilds the URL's query string from the current filters on every change,
  // so the address bar always reflects what's on screen (shareable, survives
  // refresh/back-button) — previously only q/category/barangay were synced.
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filters.category) params.set('category', filters.category);
    if (filters.barangay) params.set('barangay', filters.barangay);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.minRating) params.set('minRating', filters.minRating);
    params.set('sort', filters.sort);
    router.replace(`/search?${params.toString()}`, { scroll: false });

    const cancelledRef = { current: false };
    fetchResults(params, cancelledRef);

    return () => { cancelledRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filters]);

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-basil mb-1">
          {q ? `Results for "${q}"` : 'All Products'}
        </h1>
        <p className="text-ink/50 text-sm font-body mb-6">
          {loading ? ' ' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="bg-white/70 border border-white/70 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-basil/40">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
          </select>

          <select value={filters.barangay} onChange={(e) => setFilters({ ...filters, barangay: e.target.value })}
            className="bg-white/70 border border-white/70 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-basil/40">
            <option value="">All Barangays</option>
            {barangays.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
          </select>

          <input
            type="number" placeholder="Min ₱" value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="w-20 bg-white/70 border border-white/70 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-basil/40"
          />
          <input
            type="number" placeholder="Max ₱" value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="w-20 bg-white/70 border border-white/70 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-basil/40"
          />

          <select value={filters.minRating} onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
            className="bg-white/70 border border-white/70 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-basil/40">
            <option value="">Any Rating</option>
            <option value="4">★ 4 & up</option>
            <option value="3">★ 3 & up</option>
            <option value="2">★ 2 & up</option>
          </select>

          <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="bg-white/70 border border-white/70 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-basil/40">
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="discount">Biggest Discount</option>
          </select>

          {(filters.category || filters.barangay || filters.minPrice || filters.maxPrice || filters.minRating) && (
            <button
              onClick={() => setFilters({ category: '', barangay: '', minPrice: '', maxPrice: '', minRating: '', sort: 'newest' })}
              className="text-xs font-bold text-tomato hover:underline"
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-ink/50 text-sm font-body">Searching…</p>
        ) : products.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-12 text-center shadow-lg">
            <span className="text-4xl mb-3 block">🔍</span>
            <h2 className="font-display text-xl font-semibold text-basil mb-1">
              {q ? `No products match "${q}"` : 'No products found'}
            </h2>
            <p className="text-ink/50 text-sm font-body mb-5">
              Try a different search term or adjust your filters.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {(filters.category || filters.barangay || filters.minPrice || filters.maxPrice || filters.minRating) && (
                <button
                  onClick={() => setFilters({ category: '', barangay: '', minPrice: '', maxPrice: '', minRating: '', sort: 'newest' })}
                  className="bg-white border border-basil/30 text-basil hover:bg-basil/5 font-bold text-sm px-5 py-2.5 rounded-xl transition-all"
                >
                  Clear Filters
                </button>
              )}
              <Link href="/" className="inline-block bg-basil hover:bg-basil-light text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
                Browse All Products
              </Link>
            </div>
          </div>
        ) : (
          <ProductGrid categories={[]} products={products} />
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="p-10 text-ink/50 text-sm">Loading…</p>}>
      <SearchContent />
    </Suspense>
  );
}