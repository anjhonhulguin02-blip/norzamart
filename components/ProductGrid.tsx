"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, useReducedMotion } from 'framer-motion';
import ProductCard from './ui/ProductCard';
import { useToast } from './ui/Toast';
import { BasketIcon, CloseIcon, MarketCategoryIcon } from './ui/NorzaIcons';

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
  const reduceMotion = useReducedMotion();

  const categoryThemes = [
    'bg-basil text-white',
    'bg-tomato text-white',
    'bg-forest-deep text-white',
    'bg-mint-wash text-basil',
    'bg-tomato-wash text-tomato',
    'bg-white text-basil border border-line',
  ];

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
    <section className="nm-container nm-section">
      
      {/* Categories Section */}
      {categories.length > 0 && (
      <div id="shop-categories" className="mb-11 scroll-mt-36">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="nm-kicker">Shop by category</p>
            <h2 className="nm-section-title mt-1">Find your market aisle</h2>
          </div>
          <span className="hidden text-xs font-semibold text-stone sm:block">Local essentials, all in one place</span>
        </div>
        
        {categories.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.22 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } } }}
            className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((cat, index) => {
              const isActive = activeCategory === cat.name;
              return (
                <motion.div
                  key={cat.id}
                  variants={{
                    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.97 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: 'easeOut' } },
                  }}
                  className="w-[10.5rem] shrink-0 snap-start sm:w-[11.5rem] lg:min-w-0 lg:flex-1"
                >
                  <Link
                    href={isActive ? '/' : `/?category=${encodeURIComponent(cat.name)}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex min-h-[9.25rem] flex-col justify-between overflow-hidden rounded-[0.85rem] p-4 shadow-[0_8px_24px_rgba(24,49,39,0.08)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(24,49,39,0.14)] ${categoryThemes[index % categoryThemes.length]} ${isActive ? 'ring-3 ring-mint-glow ring-offset-2' : ''}`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-black leading-5">{cat.name}</span>
                      {cat.count !== undefined && (
                        <span className="rounded-full bg-white/18 px-2 py-1 font-mono text-[9px] font-black backdrop-blur-sm">
                          {cat.count} items
                        </span>
                      )}
                    </span>
                    <span aria-hidden="true" className="absolute -bottom-7 -right-5 h-24 w-24 rounded-full border-[18px] border-current opacity-[0.08]" />
                    <span className="relative flex items-end justify-between">
                      <MarketCategoryIcon category={cat.name} size={39} className="opacity-85 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105" />
                      <span className="text-[10px] font-black uppercase tracking-[0.08em] opacity-72">Shop now</span>
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <p className="text-sm text-emerald-800/60 italic">No categories available at the moment.</p>
        )}
      </div>
      )}

      {/* Products Section */}
      <div id="latest-products" className="mb-5 flex scroll-mt-36 items-end justify-between gap-4">
        <div>
          <p className="nm-kicker">Fresh from the marketplace</p>
          <h2 className="nm-section-title mt-2">
            {activeCategory ? `${activeCategory}` : 'Featured products'}
          </h2>
          {!activeCategory && <p className="mt-1 text-xs text-stone">Everyday finds from sellers across Norzagaray.</p>}
        </div>
        {activeCategory && (
          <Link href="/" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control px-2 text-xs font-bold text-tomato transition-colors hover:bg-tomato-wash">
            <CloseIcon size={16} /> Clear filter
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="nm-surface flex w-full flex-col items-center justify-center p-10 text-center sm:p-14">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mint-wash text-basil"><BasketIcon size={26} /></span>
          <h3 className="text-lg font-bold text-ink">
            {activeCategory ? `No products in ${activeCategory} yet` : 'No products listed yet'}
          </h3>
          <p className="mt-2 max-w-md text-sm text-stone">
            {activeCategory ? 'Check back soon or browse other categories.' : 'Be the first seller to upload a product to NorzaMart!'}
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.055 } } }}
          className="nm-product-grid"
        >
          {products.map((prod) => (
            <motion.div
              key={prod.id}
              variants={{
                hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.98 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: 'easeOut' } },
              }}
              className="h-full"
            >
              <ProductCard
                product={prod}
                badge={prod.tag}
                showWishlist
                showAddToBasket
                isWishlisted={wishlisted.has(String(prod.id))}
                onToggleWishlist={toggleWishlist}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
