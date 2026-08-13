"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ui/ProductCard';

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
      setTimeLeft(null);
      return;
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
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  return timeLeft;
}

export default function TodaysDeals({ deals }: { deals: Deal[] }) {
  // Count down to the soonest real, future promotionEndsAt among today's
  // deals — never a generic reset timer unrelated to an actual promotion.
  const futureEndDates = deals
    .map((d) => (d.promotionEndsAt ? new Date(d.promotionEndsAt) : null))
    .filter((d): d is Date => !!d && d.getTime() > Date.now());
  const nextEnd = futureEndDates.length > 0
    ? new Date(Math.min(...futureEndDates.map((d) => d.getTime())))
    : null;

  const timeLeft = useCountdown(nextEnd);

  if (deals.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm flex items-center gap-2">
          🔥 Today's Deals
        </h2>
        {timeLeft && (
          <div className="flex items-center gap-1.5 bg-tomato text-white text-xs font-bold px-3 py-1.5 rounded-full">
            Ends in <span className="font-mono">{pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {deals.map((d, i) => {
          const discountPct = Math.round(((d.originalPrice - d.price) / d.originalPrice) * 100);
          const sold = d.soldCount || 0;
          const claimedPct = sold + d.stock > 0 ? (sold / (sold + d.stock)) * 100 : 0;
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <ProductCard product={{ ...d, progressPct: claimedPct }} badge={`-${discountPct}%`} badgeColor="tomato" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
