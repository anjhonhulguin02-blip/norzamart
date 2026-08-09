"use client";

import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function SellerStatusScreen({ status, storeName }: { status: 'pending' | 'rejected'; storeName: string }) {
  const isPending = status === 'pending';

  return (
    <div className="min-h-screen bg-cream-mist flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-10 text-center shadow-lg">
        <span className="text-5xl mb-4 block">{isPending ? '⏳' : '❌'}</span>
        <h1 className="font-display text-2xl font-semibold text-basil mb-2">
          {isPending ? 'Your store is under review' : 'Store verification declined'}
        </h1>
        <p className="text-ink/60 text-sm font-body mb-1">{storeName}</p>
        <p className="text-ink/50 text-sm font-body mt-4">
          {isPending
            ? "We're verifying your store details and government ID. You'll get a notification as soon as it's approved — you won't be able to list products or access your dashboard until then."
            : "Your store application wasn't approved. Please get in touch with our support team for more details or to reapply."}
        </p>
        <div className="flex flex-col gap-2 mt-8">
          {!isPending && (
            <Link
              href="/contact"
              className="bg-basil hover:bg-basil-light text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all"
            >
              Contact Support
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-white border border-ink/10 hover:bg-ink/5 text-ink font-bold px-5 py-2.5 rounded-full text-sm transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
