"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthPrompt } from './AuthPromptProvider';
import { useToast } from './ui/Toast';
import { CheckBadgeIcon } from './ui/NorzaIcons';

interface Props {
  sellerId: string;
  initialFollowerCount: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
  onToggle?: (following: boolean) => void;
}

export default function FollowButton({ sellerId, initialFollowerCount, size = 'md', showCount = true, onToggle }: Props) {
  const { data: session } = useSession();
  const { requireAuth } = useAuthPrompt();
  const { showToast } = useToast();
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

  const doToggle = async () => {
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
        showToast(data.message || 'Could not update follow status.', 'error');
      }
    } catch {
      setFollowing(prevFollowing);
      setCount((c) => c + (prevFollowing ? 1 : -1));
      showToast('Unable to connect to the server.', 'error');
    }
    setLoading(false);
  };

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      requireAuth(doToggle, 'Sign in to follow this store.');
      return;
    }
    doToggle();
  };

  if (size === 'sm') {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        aria-pressed={following}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          following ? 'border-basil bg-basil text-white' : 'border-basil/20 bg-mint-wash text-basil hover:border-basil/40'
        }`}
      >
        {!loading && following && <CheckBadgeIcon size={14} />}
        {loading ? 'Updating…' : following ? 'Following' : 'Follow'}
        {showCount && <span className="opacity-70"> · {count}</span>}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={loading}
        aria-pressed={following}
        className={`inline-flex min-h-12 items-center gap-2 rounded-control px-5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          following ? 'bg-basil text-white shadow-md shadow-basil/20' : 'bg-basil/10 text-basil hover:bg-basil/20'
        }`}
      >
        {!loading && following && <CheckBadgeIcon size={16} />}
        {loading ? 'Updating…' : following ? 'Following' : 'Follow store'}
      </button>
      {showCount && (
        <span className="text-ink/50 text-xs font-body">{count} follower{count === 1 ? '' : 's'}</span>
      )}
    </div>
  );
}
