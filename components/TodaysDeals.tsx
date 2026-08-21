"use client";

import React, { useEffect, useState } from 'react';
import ProductCard from './ui/ProductCard';
import { FlameIcon } from './ui/NorzaIcons';
import { motion, useReducedMotion } from 'framer-motion';

interface Deal {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image?: string;
  unit: string;
  stock: number;
  soldCount?: number;
  promotionEndsAt?: string;
}

/** Counts down to `targetDate`, or returns null once it's null/passed — the
 * caller uses that to hide the countdown badge entirely rather than showing
 * a timer disconnected from any real promotion.
 */
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);
  const targetMs = targetDate?.getTime();

  useEffect(() => {
    if (!targetMs) {
      const reset = window.setTimeout(() => setTimeLeft(null), 0);
      return () => window.clearTimeout(reset);
    }
    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    const firstTick = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(interval);
    };
  }, [targetMs]);

  return timeLeft;
}

export default function TodaysDeals({ deals }: { deals: Deal[] }) {
  const reduceMotion = useReducedMotion();
  // Count down to the soonest real, future promotionEndsAt among today's
  // deals — never a generic reset timer unrelated to an actual promotion.
  const promotionEndTimes = deals
    .map((d) => (d.promotionEndsAt ? new Date(d.promotionEndsAt).getTime() : Number.NaN))
    .filter(Number.isFinite);
  const nextEnd = promotionEndTimes.length > 0
    ? new Date(Math.min(...promotionEndTimes))
    : null;

  const timeLeft = useCountdown(nextEnd);

  if (deals.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section id="todays-deals" className="nm-container nm-section scroll-mt-36">
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[1rem] bg-tomato-wash px-5 py-5 sm:px-6">
        <span aria-hidden="true" className="absolute -right-8 -top-14 h-36 w-36 rounded-full border-[24px] border-tomato/8" />
        <div className="relative flex items-center gap-3">
          <span className="hidden h-12 w-12 items-center justify-center rounded-full bg-white text-tomato sm:flex"><FlameIcon size={22} /></span>
          <div>
            <p className="nm-kicker !text-tomato">Limited local offers</p>
            <h2 className="nm-section-title mt-1">Today&apos;s deals</h2>
            <p className="mt-1 text-xs text-stone">Small prices on everyday neighborhood finds.</p>
          </div>
        </div>
        {timeLeft && (
          <div className="relative flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-tomato">
            Ends in <span className="font-mono">{pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}</span>
          </div>
        )}
      </div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } } }}
        className="nm-product-grid"
      >
        {deals.map((d) => {
          const discountPct = Math.round(((d.originalPrice - d.price) / d.originalPrice) * 100);
          const sold = d.soldCount || 0;
          const claimedPct = sold + d.stock > 0 ? (sold / (sold + d.stock)) * 100 : 0;
          return (
            <motion.div
              key={d.id}
              variants={{
                hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.98 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: 'easeOut' } },
              }}
              className="h-full"
            >
              <ProductCard product={{ ...d, progressPct: claimedPct }} badge={`-${discountPct}%`} badgeColor="tomato" />
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
