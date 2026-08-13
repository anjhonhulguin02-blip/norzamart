"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ProductCard from './ui/ProductCard';
import { useToast } from './ui/Toast';

export interface Category {
  id: string | number;
  name: string;
  icon: string;
  count?: number;
}

export interface Product {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  tag?: string;
  brgy: string;
  unit?: string;
  rating?: number | null;
  reviewCount?: number;
  sellerVerified?: boolean;
}

interface ProductGridProps {
  categories: Category[];
  products: Product[];
  activeCategory?: string;
}

export default function ProductGrid({ categories, products, activeCategory }: ProductGridProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session) return;
    fetch('/api/wishlist/ids')
      .then((res) => res.json())
      .then((data) => setWishlisted(new Set(data.ids || [])))
      .catch(() => {});
  }, [session]);

  const toggleWishlist = async (productId: string) => {
    const isCurrentlyWishlisted = wishlisted.has(productId);
    setWishlisted((prev) => {
      const next = new Set(prev);
      if (isCurrentlyWishlisted) next.delete(productId); else next.add(productId);
      return next;
    });
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        setWishlisted((prev) => {
          const next = new Set(prev);
          if (isCurrentlyWishlisted) next.add(productId); else next.delete(productId);
          return next;
        });
        showToast('Could not update your wishlist.', 'error');
      }
    } catch {
      setWishlisted((prev) => {
        const next = new Set(prev);
        if (isCurrentlyWishlisted) next.add(productId); else next.delete(productId);
        return next;
      });
      showToast('Unable to connect to the server.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-10">
      
      {/* Categories Section */}
      {categories.length > 0 && (
      <div className="mb-10">
        <h3 className="text-sm font-black text-emerald-800/60 uppercase tracking-wider mb-4 drop-shadow-sm">Shop by Category</h3>
        
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-6 items-center">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <Link
                  key={cat.id}
                  href={isActive ? '/' : `/?category=${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className={`w-16 h-16 rounded-full backdrop-blur-md border shadow-lg flex items-center justify-center text-2xl group-hover:scale-105 transition-all relative ${
                    isActive
                      ? 'bg-basil text-white border-basil shadow-basil/30'
                      : 'bg-white/40 border-white/60 group-hover:bg-white/60'
                  }`}>
                    {cat.icon}
                    {cat.count !== undefined && (
                      <span className="absolute -top-1 -right-1 bg-tomato text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                        {cat.count}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold mt-2 drop-shadow-sm transition-all text-center ${
                    isActive ? 'text-basil' : 'text-gray-800 group-hover:text-emerald-700'
                  }`}>
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-emerald-800/60 italic">No categories available at the moment.</p>
        )}
      </div>
      )}

      {/* Products Section */}
      <div className="border-b border-emerald-900/10 pb-3 mb-6 flex justify-between items-end">
        <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm">
          {activeCategory ? `${activeCategory}` : '⚡ Latest Products'}
        </h2>
        {activeCategory && (
          <Link href="/" className="text-xs font-bold text-tomato hover:underline">
            ✕ Clear filter
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="w-full bg-white/30 backdrop-blur-md border border-white/50 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-lg">
          <span className="text-5xl mb-4 drop-shadow-md">🛒</span>
          <h3 className="text-lg font-bold text-gray-800">
            {activeCategory ? `No products in ${activeCategory} yet` : 'No products listed yet'}
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            {activeCategory ? 'Check back soon or browse other categories.' : 'Be the first seller to upload a product to NorzaMart!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              badge={prod.tag}
              showWishlist
              showAddToBasket
              isWishlisted={wishlisted.has(String(prod.id))}
              onToggleWishlist={toggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
}