"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useToast } from './Toast';
import { useAuthPrompt } from '../AuthPromptProvider';
import { formatPeso, formatUnitSuffix } from '@/lib/formatProduct';
import { BasketIcon, CheckBadgeIcon, HeartIcon, StarIcon } from './NorzaIcons';

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
        className="group block rounded-[0.75rem] bg-white p-1 transition-colors hover:bg-[#f7faf7]"
      >
        <div className="relative mb-2 flex h-24 w-full items-center justify-center overflow-hidden rounded-[0.65rem] bg-[#f3f6f3]">
          {isImageUrl(p.image) ? (
            <Image src={p.image!} alt={p.name} fill sizes="140px" unoptimized={p.image!.startsWith('data:')} className="object-contain p-1 transition-transform duration-300 group-hover:scale-[1.03]" />
          ) : (
            <BasketIcon size={30} className="text-basil/45" />
          )}
        </div>
        <h4 className="text-xs font-bold text-ink line-clamp-2">{p.name}</h4>
        <p className="font-mono text-xs font-bold text-ink mt-1">{formatPeso(p.price)} <span className="text-ink/40 font-normal">{formatUnitSuffix(p.unit)}</span></p>
      </Link>
    );
  }

  return (
    <article className="group relative flex h-full min-w-0 flex-col justify-between rounded-[0.8rem] bg-white p-1 transition-colors hover:bg-[#f8faf8] sm:p-1.5">
      {/* Covers the whole card so the card is clickable everywhere without nesting
          the wishlist/add-to-basket buttons inside an <a> (invalid HTML that makes
          screen readers skip or mishandle them). z-0 + position:absolute puts it
          above the static image/text content but below the z-10 buttons below,
          so those stay independently clickable via normal CSS stacking. */}
      <Link href={`/product/${p.id}`} aria-label={`View ${p.name}`} className="absolute inset-0 z-0 rounded-[0.8rem]" />

      {badge && (
        <span className={`absolute left-2.5 top-2.5 z-10 rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white sm:left-3 sm:top-3 ${
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
          className={`absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:right-2.5 sm:top-2.5 ${
            isWishlisted ? 'border-tomato bg-tomato text-white' : 'border-line bg-paper/95 text-tomato hover:border-tomato/35 hover:bg-tomato-wash'
          }`}
        >
          <HeartIcon size={18} filled={isWishlisted} />
        </button>
      )}

      <div className="relative mb-3 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[0.65rem] bg-[#f3f6f3] text-basil/35">
        {isImageUrl(p.image) ? (
          <Image src={p.image!} alt={p.name} fill sizes="(max-width: 767px) 46vw, (max-width: 1023px) 30vw, (max-width: 1439px) 22vw, 230px" unoptimized={p.image!.startsWith('data:')} className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.035]" />
        ) : (
          <BasketIcon size={38} />
        )}
      </div>

      <div className="min-w-0 flex-1 px-1 sm:px-1.5">
        {(p.brgy || p.category) && (
          <div className="mb-1 flex min-w-0 items-center gap-1">
            <span className="block max-w-full truncate text-[9px] font-black uppercase tracking-[0.05em] text-basil">
              {p.brgy || p.category}
            </span>
            {p.sellerVerified && (
              <span title="Verified seller" className="shrink-0 text-basil">
                <CheckBadgeIcon size={14} />
                <span className="sr-only">Verified seller</span>
              </span>
            )}
          </div>
        )}

        <h3 className="line-clamp-2 text-xs font-extrabold leading-snug tracking-tight text-ink sm:text-sm">{p.name}</h3>

        {p.rating != null && p.rating > 0 && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-ink/70">
            <StarIcon size={13} filled className="text-[#9b6610]" />
            {p.rating.toFixed(1)} <span className="text-stone">({p.reviewCount})</span>
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="font-mono text-sm font-black tracking-tight text-basil sm:text-base">{formatPeso(p.price)}</span>
          {p.originalPrice && <span className="font-mono text-[10px] font-medium text-stone line-through sm:text-xs">{formatPeso(p.originalPrice)}</span>}
          <span className="text-[10px] text-stone">{formatUnitSuffix(p.unit)}</span>
        </div>

        {p.stock !== undefined && (
          <p className="mt-1 text-[10px] text-stone">{p.stock} left in stock</p>
        )}

        {p.progressPct !== undefined && (
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-tomato/15">
              <div
                className="h-full bg-tomato rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(p.progressPct, 4))}%` }}
              />
            </div>
            <p className="mt-1 text-[9px] font-bold text-tomato">{Math.round(p.progressPct)}% claimed</p>
          </div>
        )}
      </div>

      {showAddToBasket && (
        <button
          onClick={handleAddToBasket}
          disabled={adding}
          className="relative z-10 mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-basil bg-white px-3 text-[11px] font-black text-basil transition-colors hover:bg-basil hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!adding && <BasketIcon size={16} />}
          {adding ? 'Adding…' : 'Add to basket'}
        </button>
      )}
    </article>
  );
}
