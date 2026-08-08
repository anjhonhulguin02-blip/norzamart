"use client";

import React, { useEffect, useState } from 'react';

interface Announcement {
  _id: string;
  title: string;
  body: string;
}

export default function AnnouncementBanner({ className = 'max-w-7xl mx-auto px-4 mt-6' }: { className?: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    try {
      setDismissed(JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'));
    } catch {
      // ignore
    }
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

  return (
    <div className={`${className} flex flex-col gap-2`}>
      {visible.map((a) => (
        <div
          key={a._id}
          className="bg-basil/10 border border-basil/20 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
        >
          <p className="text-basil text-xs sm:text-sm font-semibold">
            📣 <span className="font-bold">{a.title}</span> — {a.body}
          </p>
          <button
            onClick={() => dismiss(a._id)}
            aria-label="Dismiss"
            className="text-basil/50 hover:text-basil font-bold text-sm shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
