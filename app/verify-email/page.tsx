"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing a token.');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        setStatus(res.ok ? 'success' : 'error');
        setMessage(data.message);
      } catch {
        setStatus('error');
        setMessage('Unable to connect to the server.');
      }
    })();
  }, [token]);

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-8 shadow-lg text-center">
          {status === 'verifying' && (
            <>
              <span className="text-4xl mb-3 block">⏳</span>
              <p className="text-ink/60 text-sm font-body">Verifying your email…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <span className="text-4xl mb-3 block">✅</span>
              <h1 className="font-display text-xl font-semibold text-basil mb-1">Email verified!</h1>
              <p className="text-ink/60 text-sm font-body">{message}</p>
            </>
          )}
          {status === 'error' && (
            <>
              <span className="text-4xl mb-3 block">❌</span>
              <h1 className="font-display text-xl font-semibold text-tomato mb-1">Verification failed</h1>
              <p className="text-ink/60 text-sm font-body">{message}</p>
            </>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
