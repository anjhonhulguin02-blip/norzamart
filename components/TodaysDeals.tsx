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
}

function useCountdownToMidnight() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

export default function TodaysDeals({ deals }: { deals: Deal[] }) {
  const { h, m, s } = useCountdownToMidnight();

  if (deals.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm flex items-center gap-2">
          🔥 Today's Deals
        </h2>
        <div className="flex items-center gap-1.5 bg-tomato text-white text-xs font-bold px-3 py-1.5 rounded-full">
          Ends in <span className="font-mono">{pad(h)}:{pad(m)}:{pad(s)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {deals.map((d, i) => {
          const discountPct = Math.round(((d.originalPrice - d.price) / d.originalPrice) * 100);
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <ProductCard product={d} badge={`-${discountPct}%`} badgeColor="tomato" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}