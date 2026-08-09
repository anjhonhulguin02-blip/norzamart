"use client";

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch {
      setError('Unable to connect to the server.');
    }
    setIsSubmitting(false);
  };

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-8 shadow-lg">
          <h1 className="font-display text-2xl font-semibold text-basil mb-1">Forgot your password?</h1>
          <p className="text-ink/50 text-sm font-body mb-6">
            Enter your email and we'll send you a link to reset it.
          </p>

          {message ? (
            <div className="bg-basil/10 border border-basil/20 text-basil text-sm font-semibold rounded-xl p-4 text-center">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-tomato/10 border border-tomato/20 text-tomato text-xs font-semibold rounded-xl p-3 text-center">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="juandelacruz@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-gray-800"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md mt-2 text-sm transition-all tracking-wide border-none cursor-pointer"
              >
                {isSubmitting ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-600 mt-6">
            <Link href="/" className="text-emerald-700 font-extrabold hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
