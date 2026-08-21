"use client";

import React, { useEffect, useState } from 'react';
import { useMotionValue, useTransform, animate } from 'framer-motion';
import { MapPinIcon, PackageIcon, StoreIcon, UsersIcon } from './ui/NorzaIcons';

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
    { label: 'Local sellers', value: stats?.sellers ?? 0, icon: StoreIcon },
    { label: 'Products listed', value: stats?.products ?? 0, icon: PackageIcon },
    { label: 'Barangays covered', value: stats?.barangays ?? 13, icon: MapPinIcon },
    { label: 'Community members', value: stats?.members ?? 0, icon: UsersIcon },
  ];

  return (
    <section className="nm-container mt-7" aria-label="NorzaMart community statistics">
      <div className="grid grid-cols-2 overflow-hidden rounded-[0.85rem] border border-line bg-white shadow-[0_6px_22px_rgba(24,49,39,0.05)] md:grid-cols-4">
        {items.map((item) => {
          const ItemIcon = item.icon;
          return (
          <div
            key={item.label}
            className="flex min-w-0 items-center gap-3 border-b border-r border-line p-3.5 text-left last:border-r-0 sm:p-4 md:border-b-0"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.65rem] bg-mint-wash text-basil"><ItemIcon size={19} /></span>
            <div className="min-w-0">
              <div className="flex h-6 items-center font-mono text-base font-black text-basil sm:text-lg">
                {loading ? (
                  <span className="nm-shimmer inline-block h-4 w-9 rounded" aria-hidden="true" />
                ) : (
                  <Counter value={item.value} suffix="+" />
                )}
              </div>
              <p className="truncate text-[10px] font-semibold leading-4 text-stone sm:text-xs">{item.label}</p>
            </div>
          </div>
        );})}
      </div>
    </section>
  );
}
