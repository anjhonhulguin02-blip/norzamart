"use client";

import { useEffect, useState } from 'react';
import BrandedStatusScreen from './ui/BrandedStatusScreen';

/** Only the browser knows when it's lost its connection — this can't be
 * detected server-side, so it's a global client component mounted in the
 * root layout that listens for the online/offline events and covers
 * whatever page is currently showing. */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <BrandedStatusScreen
      icon="📡"
      title="You're offline"
      message="Check your internet connection — we'll reconnect automatically once you're back online."
      action={
        <button
          onClick={() => window.location.reload()}
          className="mt-2 bg-basil hover:bg-basil-light text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-md shadow-basil/20 transition-all"
        >
          Try Again
        </button>
      }
    />
  );
}
