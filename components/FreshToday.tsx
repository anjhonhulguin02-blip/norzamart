"use client";

import React, { useState } from 'react';
import ProductCard from './ui/ProductCard';
import { LeafIcon } from './ui/NorzaIcons';

interface FreshProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  category: string;
}

const TABS: { label: string; categories: string[] }[] = [
  { label: 'All', categories: [] },
  { label: 'Meat', categories: ['Meat & Poultry'] },
  { label: 'Vegetables', categories: ['Vegetables'] },
  { label: 'Seafood', categories: ['Seafood'] },
  { label: 'Fruits', categories: ['Fruits'] },
];

export default function FreshToday({ products }: { products: FreshProduct[] }) {
  const [activeTab, setActiveTab] = useState('All');

  if (products.length === 0) return null;

  const activeCategories = TABS.find((t) => t.label === activeTab)?.categories || [];
  const filtered = activeCategories.length === 0
    ? products
    : products.filter((p) => activeCategories.includes(p.category));

  return (
    <section className="nm-container nm-section">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="nm-kicker flex items-center gap-2"><LeafIcon size={16} /> Just listed</p>
          <h2 className="nm-section-title mt-2">Fresh today</h2>
        </div>
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
                aria-pressed={activeTab === tab.label}
                className={`min-h-11 rounded-full border px-3.5 text-xs font-bold transition-colors ${
                  activeTab === tab.label ? 'border-basil bg-basil text-white' : 'border-line bg-paper text-stone hover:border-basil/30 hover:bg-mint-wash hover:text-basil'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-ink/50 text-sm font-body">No fresh {activeTab.toLowerCase()} listed today. Check back soon!</p>
      ) : (
        <div className="nm-product-grid">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} badge="NEW TODAY" badgeColor="basil" />
          ))}
        </div>
      )}
    </section>
  );
}
