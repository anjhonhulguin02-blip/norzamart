"use client";

import React, { useEffect, useState } from 'react';
import { CloseIcon, MegaphoneIcon } from './ui/NorzaIcons';

interface Announcement {
  _id: string;
  title: string;
  body: string;
}

interface AnnouncementBannerProps {
  className?: string;
  variant?: 'card' | 'utility';
}

export default function AnnouncementBanner({ className, variant = 'card' }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.announcements || []))
      .catch(() => {});
  }, []);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('dismissed_announcements', JSON.stringify(next));
  };

  const visible = announcements.filter((a) => !dismissed.includes(a._id));
  if (visible.length === 0) return null;

  const wrapperClass = className || (variant === 'utility' ? 'w-full bg-forest-deep' : 'nm-container mt-6');

  return (
    <div className={`${wrapperClass} flex flex-col ${variant === 'utility' ? '' : 'gap-2'}`}>
      {visible.map((a) => (
        <div
          key={a._id}
          className={variant === 'utility'
            ? 'nm-container flex min-h-11 items-center justify-between gap-3 py-1 text-white'
            : 'flex items-start justify-between gap-3 rounded-control border border-basil/20 bg-mint-wash px-3 py-2.5 sm:px-4'}
        >
          <p className={`flex min-w-0 items-start gap-2 py-1.5 text-xs font-semibold leading-5 ${variant === 'utility' ? 'text-white/90' : 'text-basil sm:text-sm'}`}>
            <MegaphoneIcon size={18} className="mt-0.5 shrink-0" />
            <span><span className="font-bold">{a.title}</span> — {a.body}</span>
          </p>
          <button
            onClick={() => dismiss(a._id)}
            aria-label={`Dismiss ${a.title} announcement`}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${variant === 'utility' ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-basil/65 hover:bg-basil/10 hover:text-basil'}`}
          >
            <CloseIcon size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
