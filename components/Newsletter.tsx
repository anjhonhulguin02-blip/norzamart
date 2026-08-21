"use client";

import React, { useState } from 'react';
import { ArrowRightIcon, CheckBadgeIcon, LeafIcon } from './ui/NorzaIcons';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Unable to connect to the server.');
    }
    setSubmitting(false);
  };

  return (
    <section className="nm-container nm-section">
      <div className="relative overflow-hidden rounded-[1.15rem] bg-mint-wash px-5 py-8 sm:px-8 md:grid md:grid-cols-[1fr_1.2fr] md:items-center md:gap-10 md:px-10 md:py-10">
        <div aria-hidden="true" className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[28px] border-basil/7" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.11em] text-tomato"><LeafIcon size={14} /> Local offer alerts</p>
          <h2 className="mt-3 font-body text-2xl font-black tracking-[-0.035em] text-ink md:text-3xl">Get the freshest deals first.</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-stone">New neighborhood sellers, fresh drops, and market offers—sent without the clutter.</p>
        </div>
        {submitted ? (
          <p className="relative mt-6 flex items-center gap-2 rounded-control bg-white px-4 py-3 text-sm font-semibold text-basil md:mt-0" role="status">
            <CheckBadgeIcon size={20} /> Thanks! We&apos;ll keep you posted.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="relative mt-6 md:mt-0">
            <label htmlFor="newsletterEmail" className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-ink">Email address</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="newsletterEmail"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                aria-describedby={error ? 'newsletter-error' : undefined}
                className="min-h-12 min-w-0 flex-1 rounded-control border border-basil/20 bg-white px-4 text-base text-ink placeholder:text-stone focus:border-basil/50 focus:outline-none focus:ring-3 focus:ring-basil/15"
              />
              <button type="submit" disabled={submitting} className="nm-button-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? 'Subscribing…' : 'Subscribe'}
                {!submitting && <ArrowRightIcon size={17} />}
              </button>
            </div>
            {error && <p id="newsletter-error" role="alert" className="mt-2 text-xs font-semibold text-danger">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
