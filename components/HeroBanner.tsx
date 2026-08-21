"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRightIcon,
  BasketIcon,
  CheckBadgeIcon,
  LeafIcon,
  MapPinIcon,
  TruckIcon,
} from './ui/NorzaIcons';

const PREVIEW_COUNT = 6;

interface HeroProduct {
  id: string;
  name: string;
  image?: string;
  category?: string;
}

const stageLayouts = [
  {
    group: 'right-[2%] top-[31%] z-10 w-[41%]',
    platform: 'h-[7.5rem] sm:h-[8.25rem]',
    cluster: 'h-[8.2rem] w-[96%] sm:h-[9.5rem]',
  },
  {
    group: 'bottom-[6%] left-[2%] z-20 w-[38%]',
    platform: 'h-[4.65rem] sm:h-[5.25rem]',
    cluster: 'h-[7.2rem] w-[96%] sm:h-[8.3rem]',
  },
  {
    group: 'bottom-[1%] right-[7%] z-30 w-[52%]',
    platform: 'h-[5.4rem] sm:h-[6.15rem]',
    cluster: 'h-[7.7rem] w-[82%] sm:h-[9rem]',
  },
];

const clusterPositions = [
  ['left-1/2 w-[72%]'],
  ['left-[35%] w-[60%]', 'left-[67%] w-[60%]'],
  ['left-[23%] w-[48%]', 'left-1/2 w-[52%]', 'left-[77%] w-[48%]'],
  ['left-[16%] w-[40%]', 'left-[39%] w-[44%]', 'left-[63%] w-[44%]', 'left-[86%] w-[40%]'],
];

const stageLayoutOrder = [
  [2],
  [1, 2],
  [0, 1, 2],
];

function cutoutUrl(image?: string) {
  if (!image?.startsWith('http')) return image;
  if (!image.includes('res.cloudinary.com') || !image.includes('/image/upload/')) return image;
  return image.replace('/image/upload/', '/image/upload/e_background_removal/e_trim/f_auto,q_auto/');
}

export default function HeroBanner({ products = [] }: { products?: HeroProduct[] }) {
  const [showAll, setShowAll] = useState(false);
  const [barangays, setBarangays] = useState<string[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    fetch('/api/barangays')
      .then((res) => res.json())
      .then((data) => setBarangays((data.barangays || []).map((b: { name: string }) => b.name)))
      .catch(() => setBarangays([]));
  }, []);

  const visibleBarangays = showAll ? barangays : barangays.slice(0, PREVIEW_COUNT);
  const groupedProducts = Array.from(
    products.reduce((groups, product) => {
      const category = product.category?.trim() || 'Local picks';
      const existing = groups.get(category) || [];
      if (existing.length < 4) existing.push(product);
      groups.set(category, existing);
      return groups;
    }, new Map<string, HeroProduct[]>()),
    ([category, items]) => ({ category, items }),
  )
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 3)
    .sort((a, b) => a.items.length - b.items.length);

  const activeLayouts = stageLayoutOrder[Math.max(groupedProducts.length, 1) - 1];

  return (
    <section className="nm-container mt-5 md:mt-6" aria-labelledby="market-stage-title">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-basil/10 bg-mint-wash shadow-[0_20px_52px_rgba(24,49,39,0.12)]">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[38%] bg-tomato-wash [clip-path:polygon(0_30%,100%_0,100%_100%,0_100%)]" />
        <div aria-hidden="true" className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/55 blur-2xl" />
        <div aria-hidden="true" className="absolute right-[35%] top-8 h-24 w-24 rounded-full border-[22px] border-white/30" />

        <div className="relative grid min-h-[34rem] items-center gap-7 px-5 py-9 sm:px-8 md:min-h-[31rem] md:grid-cols-12 md:px-10 md:py-10 lg:px-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: 'easeOut' }}
            className="relative z-20 md:col-span-6 lg:col-span-5"
          >
            <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-basil-light">
              <LeafIcon size={16} /> One market. Thirteen barangays.
            </p>
            <h1 id="market-stage-title" className="mt-4 max-w-[38rem] font-body text-[clamp(2.55rem,6vw,4.55rem)] font-black leading-[0.94] tracking-[-0.058em] text-forest-deep text-balance">
              Shopping, the Norzagaray way.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-ink/72 sm:text-base sm:leading-7">
              Fresh picks, pantry staples, and neighborhood favorites—brought together by sellers close to home.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="#latest-products" className="nm-button-primary">
                Shop local products <ArrowRightIcon size={18} />
              </Link>
              <Link href="#shop-categories" className="nm-button-secondary !bg-white/74">
                Browse categories
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-basil">
              <span className="inline-flex items-center gap-1.5"><TruckIcon size={15} /> Same-day local routes</span>
              <span className="inline-flex items-center gap-1.5"><CheckBadgeIcon size={15} /> Verified sellers</span>
            </div>
          </motion.div>

          <div className="relative z-10 min-h-[21rem] md:col-span-6 md:min-h-[27rem] lg:col-span-7" aria-label="Featured local products">
            <div aria-hidden="true" className="absolute inset-x-[5%] bottom-[2%] h-10 rounded-[50%] bg-forest-deep/8 blur-xl" />
            {groupedProducts.map((group, index) => {
              const layoutIndex = activeLayouts[index];
              const layout = stageLayouts[layoutIndex];
              return (
              <motion.div
                key={group.category}
                initial={reduceMotion ? false : { opacity: 0, y: 32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 125, damping: 16, delay: 0.18 + index * 0.11 }}
                className={`absolute ${layout.group}`}
              >
                <motion.div
                  whileHover={reduceMotion ? undefined : { scale: 1.012 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className={`absolute bottom-[calc(100%_-_1.3rem)] left-1/2 z-20 -translate-x-1/2 ${layout.cluster}`}
                  aria-label={`${group.category} products`}
                >
                  <span aria-hidden="true" className="absolute inset-x-[12%] bottom-1 h-5 rounded-full bg-forest-deep/24 blur-md" />
                  {group.items.map((product, productIndex, items) => {
                    const positions = clusterPositions[Math.min(items.length, 4) - 1] || clusterPositions[0];
                    const image = cutoutUrl(product.image);
                    return (
                      <motion.div
                        key={product.id}
                        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 150, damping: 17, delay: 0.28 + index * 0.1 + productIndex * 0.055 }}
                        className={`nm-stage-cutout absolute bottom-0 h-full -translate-x-1/2 ${positions[productIndex]}`}
                        style={{ zIndex: productIndex + 1 }}
                      >
                        <Link
                          href={`/product/${product.id}`}
                          aria-label={`View ${product.name} in ${group.category}`}
                          className="nm-stage-product relative flex h-full w-full items-end justify-center rounded-[0.65rem] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-basil focus-visible:ring-offset-2"
                        >
                          {image?.startsWith('http') ? (
                            <Image src={image} alt={product.name} fill sizes="(max-width: 767px) 22vw, 130px" priority={index === 0 && productIndex === 0} unoptimized className="object-contain object-bottom p-0.5" />
                          ) : (
                            <span className="flex h-full items-end justify-center pb-3 text-basil/45"><BasketIcon size={42} /></span>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
                <div className={`nm-stage-block relative z-10 ${layout.platform}`}>
                  <span className="absolute bottom-2 left-3 right-3 z-10 truncate text-[8px] font-black uppercase tracking-[0.11em] text-white/92 sm:text-[9px]">
                    {group.category}
                  </span>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {barangays.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-y border-line py-3 sm:flex-row sm:items-center">
          <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.12em] text-basil">Delivering across Norzagaray</p>
          <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1 overflow-hidden">
            {visibleBarangays.map((barangay) => (
              <span key={barangay} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-stone"><MapPinIcon size={13} className="text-tomato" /> {barangay}</span>
            ))}
          </div>
          {barangays.length > PREVIEW_COUNT && (
            <button type="button" onClick={() => setShowAll(!showAll)} aria-expanded={showAll} className="inline-flex min-h-11 shrink-0 items-center gap-1 self-start text-xs font-black text-basil transition-colors hover:text-tomato sm:self-auto">
              {showAll ? 'Show less' : `View all ${barangays.length}`} <ArrowRightIcon size={14} className={`transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
