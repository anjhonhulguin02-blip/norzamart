"use client";

import React, { useState } from 'react';
import ProductCard from './ui/ProductCard';

interface FreshProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  category: string;
}

const TABS: { label: string; icon: string; categories: string[] }[] = [
  { label: 'All', icon: '🌱', categories: [] },
  { label: 'Meat', icon: '🍗', categories: ['Meat & Poultry'] },
  { label: 'Vegetables', icon: '🥬', categories: ['Vegetables'] },
  { label: 'Seafood', icon: '🐟', categories: ['Seafood'] },
  { label: 'Fruits', icon: '🍎', categories: ['Fruits'] },
];

export default function FreshToday({ products }: { products: FreshProduct[] }) {
  const [activeTab, setActiveTab] = useState('All');

  if (products.length === 0) return null;

  const activeCategories = TABS.find((t) => t.label === activeTab)?.categories || [];
  const filtered = activeCategories.length === 0
    ? products
    : products.filter((p) => activeCategories.includes(p.category));

  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm">🌱 Fresh Today</h2>
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const count = tab.categories.length === 0
              ? products.length
              : products.filter((p) => tab.categories.includes(p.category)).length;
            if (tab.label !== 'All' && count === 0) return null;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${
                  activeTab === tab.label ? 'bg-basil text-white' : 'bg-white/60 text-ink/60 hover:bg-basil/5'
                }`}
              >
                {tab.icon} {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink/50 text-sm font-body">No fresh {activeTab.toLowerCase()} listed today. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} badge="NEW TODAY" badgeColor="basil" />
          ))}
        </div>
      )}
    </div>
  );
}
