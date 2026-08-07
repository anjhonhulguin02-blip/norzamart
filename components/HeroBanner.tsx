"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const PREVIEW_COUNT = 6;

export default function HeroBanner() {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [barangays, setBarangays] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/barangays')
      .then((res) => res.json())
      .then((data) => setBarangays((data.barangays || []).map((b: any) => b.name)));
  }, []);

  const visibleBarangays = showAll ? barangays : barangays.slice(0, PREVIEW_COUNT);

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-basil via-basil-light to-basil pt-16 pb-16">

      {/* Ambient glow orbs */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-mint-glow rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-mint-glow rounded-full mix-blend-multiply filter blur-3xl opacity-30" />

      {/* Floating produce, decorative */}
      <div aria-hidden className="absolute top-24 right-[12%] text-6xl opacity-70 animate-float-slow select-none hidden md:block">🥬</div>
      <div aria-hidden className="absolute bottom-16 right-[26%] text-5xl opacity-60 animate-float-slow-delay select-none hidden md:block">🍅</div>
      <div aria-hidden className="absolute top-1/2 right-[4%] text-4xl opacity-50 animate-float-slow select-none hidden lg:block">🥕</div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-xl bg-white/10 backdrop-blur-2xl border border-white/25 rounded-[2rem] p-8 md:p-12 shadow-2xl"
        >
          <span className="inline-block bg-tomato text-white text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-full shadow-sm">
            Support Local Sellers
          </span>

          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mt-5 leading-[1.05] text-white">
            Fresh, local,
            <br />
            delivered today.
          </h1>

          <p className="text-white/80 text-sm md:text-base mt-4 font-body max-w-md">
            Free delivery on orders over ₱500. Quality produce and daily goods sourced directly from trusted vendors near you.
          </p>

          <motion.button
            onClick={() => router.push('/search')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-8 bg-white text-basil font-bold px-8 py-3.5 rounded-full shadow-lg shadow-black/10 transition-all text-sm"
          >
            Shop Now →
          </motion.button>
        </motion.div>

        {/* Trust stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="flex flex-wrap gap-6 md:gap-10 mt-10 pl-2"
        >
          {[
            [String(barangays.length || 13), 'Barangays served'],
            ['₱500', 'Free delivery minimum'],
            ['100%', 'Local vendors'],
          ].map(([value, label]) => (
            <div key={label}>
              <div className="font-mono text-2xl font-bold text-white">{value}</div>
              <div className="text-white/60 text-xs font-body mt-0.5">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Barangay coverage — contained box, no overflow */}
        <div className="mt-10 pt-6 border-t border-white/15">
          <p className="text-white/50 text-[11px] font-body uppercase tracking-wider mb-3">
            Proudly serving every barangay in Norzagaray
          </p>

          <div className="flex flex-wrap gap-2">
            <AnimatePresence initial={false}>
              {visibleBarangays.map((brgy) => (
                <motion.span
                  key={brgy}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white/85 bg-white/10 border border-white/15 backdrop-blur-sm px-3.5 py-2 rounded-full whitespace-nowrap"
                >
                  📍 {brgy}
                </motion.span>
              ))}
            </AnimatePresence>

            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs sm:text-sm font-bold text-white bg-tomato/90 hover:bg-tomato px-3.5 py-2 rounded-full transition-all whitespace-nowrap"
            >
              {showAll ? '← Show less' : `View all ${barangays.length} →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}