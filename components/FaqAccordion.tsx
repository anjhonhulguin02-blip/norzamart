"use client";

import React, { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl shadow-lg overflow-hidden">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question} className={i !== items.length - 1 ? 'border-b border-ink/5' : ''}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex items-center justify-between gap-4 text-left px-6 py-4 hover:bg-basil/5 transition-colors"
            >
              <span className="font-semibold text-sm text-ink">{item.question}</span>
              <span className={`text-basil text-lg shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
            </button>
            {open && (
              <p className="text-ink/70 text-sm font-body leading-relaxed px-6 pb-4">{item.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
