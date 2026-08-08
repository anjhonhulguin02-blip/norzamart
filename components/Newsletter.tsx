"use client";

import React, { useState } from 'react';

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
    <div className="max-w-4xl mx-auto px-4 mt-16">
      <div className="bg-basil rounded-3xl p-8 md:p-10 text-center shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-mint-glow rounded-full opacity-20 blur-2xl" />
        <h2 className="font-display text-2xl font-semibold text-white mb-2 relative">Stay in the loop 🌾</h2>
        <p className="text-white/70 text-sm font-body mb-5 relative">Get notified about new local sellers and fresh drops in your barangay.</p>
        {submitted ? (
          <p className="text-white font-semibold text-sm relative">Thanks! We'll keep you posted. 🎉</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 bg-white/95 rounded-full px-4 py-2.5 text-sm focus:outline-none"
            />
            <button type="submit" disabled={submitting} className="bg-white text-basil font-bold text-sm px-6 py-2.5 rounded-full hover:bg-white/90 disabled:opacity-60 transition-all">
              {submitting ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
        {error && <p className="text-white text-xs font-semibold mt-3 relative bg-tomato/30 rounded-full py-1.5 px-4 inline-block">{error}</p>}
      </div>
    </div>
  );
}
