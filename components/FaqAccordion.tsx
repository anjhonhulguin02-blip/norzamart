"use client";

import React, { useId, useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

function FaqRow({ item, open, onToggle, isLast }: { item: FaqItem; open: boolean; onToggle: () => void; isLast: boolean }) {
  const panelId = useId();
  return (
    <div className={isLast ? '' : 'border-b border-ink/5'}>
      <h3>
        <button
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full flex items-center justify-between gap-4 text-left px-6 py-4 hover:bg-basil/5 transition-colors"
        >
          <span className="font-semibold text-sm text-ink">{item.question}</span>
          <span aria-hidden="true" className={`text-basil text-lg shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
        </button>
      </h3>
      {open && (
        <p id={panelId} className="text-ink/70 text-sm font-body leading-relaxed px-6 pb-4">{item.answer}</p>
      )}
    </div>
  );
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl shadow-lg overflow-hidden">
      {items.map((item, i) => (
        <FaqRow
          key={item.question}
          item={item}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          isLast={i === items.length - 1}
        />
      ))}
    </div>
  );
}
