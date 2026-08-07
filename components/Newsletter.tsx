"use client";

import React, { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Note: no backend wired up yet — this just gives UI feedback for now.
    setSubmitted(true);
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
            <button type="submit" className="bg-white text-basil font-bold text-sm px-6 py-2.5 rounded-full hover:bg-white/90 transition-all">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}