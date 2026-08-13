"use client";

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface Stats {
  sellers: number;
  products: number;
  barangays: number;
  members: number;
}

// Animates up whenever `value` changes, rather than gating on
// framer-motion's useInView(once: true) — that combination was observed to
// sometimes never fire (e.g. if the element is already past the viewport's
// intersection margin the moment it mounts), permanently stranding these at
// "0+" for real users instead of just during the initial data-loading beat.
// StatsSection only renders this once real data has arrived, so `value`
// reliably changes from nothing to the real number exactly once.
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.4, ease: 'easeOut' });
    return controls.stop;
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => setDisplay(v));
    return unsubscribe;
  }, [rounded]);

  return <span>{display}{suffix}</span>;
}

export default function StatsSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items = [
    { label: 'Local Sellers', value: stats?.sellers ?? 0, icon: '🏬' },
    { label: 'Products Listed', value: stats?.products ?? 0, icon: '📦' },
    { label: 'Barangays Covered', value: stats?.barangays ?? 13, icon: '📍' },
    { label: 'Community Members', value: stats?.members ?? 0, icon: '🤝' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 text-center shadow-sm"
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="font-mono text-2xl font-bold text-basil mt-1 h-8 flex items-center justify-center">
              {loading ? (
                <span className="inline-block w-10 h-5 rounded bg-basil/10 animate-pulse" aria-hidden="true" />
              ) : (
                <Counter value={item.value} suffix="+" />
              )}
            </div>
            <p className="text-ink/50 text-xs font-body mt-0.5">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}