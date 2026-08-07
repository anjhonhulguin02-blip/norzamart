"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Props {
  sellerId: string;
  initialFollowerCount: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
  onToggle?: (following: boolean) => void;
}

export default function FollowButton({ sellerId, initialFollowerCount, size = 'md', showCount = true, onToggle }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch('/api/follow/ids')
      .then((res) => res.json())
      .then((data) => setFollowing((data.ids || []).includes(sellerId)))
      .catch(() => {});
  }, [session, sellerId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      router.push('/');
      return;
    }
    setLoading(true);
    const prevFollowing = following;
    setFollowing(!prevFollowing);
    setCount((c) => c + (prevFollowing ? -1 : 1));
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFollowing(data.following);
        setCount(data.followerCount);
        onToggle?.(data.following);
      } else {
        setFollowing(prevFollowing);
        setCount((c) => c + (prevFollowing ? 1 : -1));
      }
    } catch {
      setFollowing(prevFollowing);
      setCount((c) => c + (prevFollowing ? 1 : -1));
    }
    setLoading(false);
  };

  if (size === 'sm') {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all disabled:opacity-60 ${
          following ? 'bg-basil text-white' : 'bg-basil/10 text-basil hover:bg-basil/20'
        }`}
      >
        {following ? '✔ Following' : '+ Follow'}
        {showCount && <span className="opacity-70"> · {count}</span>}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 ${
          following ? 'bg-basil text-white shadow-md shadow-basil/20' : 'bg-basil/10 text-basil hover:bg-basil/20'
        }`}
      >
        {following ? '✔ Following' : '+ Follow Store'}
      </button>
      {showCount && (
        <span className="text-ink/50 text-xs font-body">{count} follower{count === 1 ? '' : 's'}</span>
      )}
    </div>
  );
}
