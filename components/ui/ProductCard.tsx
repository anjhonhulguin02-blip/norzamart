"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useToast } from './Toast';
import { useAuthPrompt } from '../AuthPromptProvider';
import { formatPeso, formatUnitSuffix } from '@/lib/formatProduct';

// Some callers pass a real photo (Cloudinary URL or legacy base64 data URI); others pass a bare
// emoji string as a "no photo" placeholder. Only the former should ever be rendered as an <img>.
const isImageUrl = (img?: string) => !!img && (img.startsWith('http') || img.startsWith('data:'));

export interface ProductCardData {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  unit?: string;
  stock?: number;
  brgy?: string;
  category?: string;
  sellerVerified?: boolean;
  rating?: number | null;
  reviewCount?: number;
  progressPct?: number;
}

interface ProductCardProps {
  product: ProductCardData;
  badge?: string;
  badgeColor?: 'tomato' | 'basil';
  compact?: boolean;
  showWishlist?: boolean;
  showAddToBasket?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
}

export default function ProductCard({
  product: p,
  badge,
  badgeColor = 'tomato',
  compact = false,
  showWishlist = false,
  showAddToBasket = false,
  isWishlisted = false,
  onToggleWishlist,
}: ProductCardProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { requireAuth } = useAuthPrompt();
  const [adding, setAdding] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const productId = String(p.id);

  const doToggleWishlist = () => {
    setWishlistBusy(true);
    try {
      onToggleWishlist?.(productId);
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      requireAuth(doToggleWishlist, 'Sign in to save items to your wishlist.');
      return;
    }
    doToggleWishlist();
  };

  const doAddToBasket = async () => {
    setAdding(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Could not add to basket.', 'error');
      } else {
        showToast(`${p.name} added to basket!`, 'success');
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch {
      showToast('Unable to connect to the server.', 'error');
    }
    setAdding(false);
  };

  const handleAddToBasket = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      requireAuth(doAddToBasket, `Sign in to add "${p.name}" to your basket.`);
      return;
    }
    doAddToBasket();
  };

  if (compact) {
    return (
      <Link
        href={`/product/${p.id}`}
        className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all"
      >
        <div className="relative w-full h-24 bg-white rounded-xl flex items-center justify-center overflow-hidden mb-2">
          {p.image?.startsWith('http') ? (
            <Image src={p.image} alt={p.name} fill sizes="140px" className="object-contain" />
          ) : isImageUrl(p.image) ? (
            <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-3xl">{p.image || '🛒'}</span>
          )}
        </div>
        <h4 className="text-xs font-bold text-ink line-clamp-2">{p.name}</h4>
        <p className="font-mono text-xs font-bold text-ink mt-1">{formatPeso(p.price)} <span className="text-ink/40 font-normal">{formatUnitSuffix(p.unit)}</span></p>
      </Link>
    );
  }

  return (
    <div className="bg-white/40 backdrop-blur-lg border border-white/60 rounded-2xl p-4 flex flex-col justify-between relative shadow-xl hover:shadow-2xl hover:bg-white/50 transition-all group">
      {/* Covers the whole card so the card is clickable everywhere without nesting
          the wishlist/add-to-basket buttons inside an <a> (invalid HTML that makes
          screen readers skip or mishandle them). z-0 + position:absolute puts it
          above the static image/text content but below the z-10 buttons below,
          so those stay independently clickable via normal CSS stacking. */}
      <Link href={`/product/${p.id}`} aria-label={p.name} className="absolute inset-0 z-0 rounded-2xl" />

      {badge && (
        <span className={`absolute top-3 left-3 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm z-10 ${
          badgeColor === 'basil' ? 'bg-basil/90' : 'bg-tomato/90'
        }`}>
          {badge}
        </span>
      )}

      {showWishlist && (
        <button
          onClick={handleWishlist}
          disabled={wishlistBusy}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all disabled:opacity-50 ${
            isWishlisted ? 'bg-tomato text-white' : 'bg-white/80 hover:bg-white text-tomato'
          }`}
        >
          {isWishlisted ? '♥' : '♡'}
        </button>
      )}

      <div className="relative w-full h-32 sm:h-40 bg-white/50 shadow-inner rounded-xl flex items-center justify-center text-4xl mb-3 overflow-hidden group-hover:scale-105 transition-transform duration-300">
        {p.image?.startsWith('http') ? (
          <Image src={p.image} alt={p.name} fill sizes="(max-width: 639px) 92vw, (max-width: 767px) 45vw, (max-width: 1023px) 30vw, (max-width: 1279px) 23vw, 230px" className="object-contain" />
        ) : isImageUrl(p.image) ? (
          <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
        ) : (
          p.image || '🛒'
        )}
      </div>

      <div>
        {(p.brgy || p.category) && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/60 border border-emerald-200/50 backdrop-blur-sm px-2 py-0.5 rounded-md block w-max">
              {p.brgy || p.category}
            </span>
            {p.sellerVerified && <span title="Verified Seller" className="text-basil text-[10px]">✔️</span>}
          </div>
        )}

        <h4 className="text-sm font-bold text-gray-800 tracking-tight leading-tight line-clamp-2">{p.name}</h4>

        {p.rating != null && p.rating > 0 && (
          <p className="text-[11px] text-yellow-600 font-semibold mt-0.5">★ {p.rating.toFixed(1)} ({p.reviewCount})</p>
        )}

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-2">
          <span className="text-base font-black text-gray-900">{formatPeso(p.price)}</span>
          {p.originalPrice && <span className="text-xs text-gray-500 font-medium line-through">{formatPeso(p.originalPrice)}</span>}
          <span className="text-[10px] text-gray-500">{formatUnitSuffix(p.unit)}</span>
        </div>

        {p.stock !== undefined && (
          <p className="text-[10px] text-gray-500 mt-1">{p.stock} left in stock</p>
        )}

        {p.progressPct !== undefined && (
          <div className="mt-2">
            <div className="w-full h-1.5 bg-tomato/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-tomato rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(p.progressPct, 4))}%` }}
              />
            </div>
            <p className="text-[9px] text-tomato font-bold mt-1">{Math.round(p.progressPct)}% claimed</p>
          </div>
        )}
      </div>

      {showAddToBasket && (
        <button
          onClick={handleAddToBasket}
          disabled={adding}
          className="relative z-10 w-full mt-4 bg-emerald-700/90 hover:bg-emerald-800 disabled:opacity-60 backdrop-blur-sm text-white text-xs font-bold py-2.5 rounded-xl border border-emerald-500/50 shadow-md transition-all"
        >
          {adding ? 'Adding…' : '+ Add to Basket'}
        </button>
      )}
    </div>
  );
}
