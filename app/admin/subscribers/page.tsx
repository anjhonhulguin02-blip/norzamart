"use client";

import React, { useEffect, useState } from 'react';

interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/newsletter').then((res) => res.json()).then((d) => setSubscribers(d.subscribers || [])).finally(() => setLoading(false));
  }, []);

  const copyAll = () => {
    navigator.clipboard.writeText(subscribers.map((s) => s.email).join(', ')).catch(() => {});
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-basil">Newsletter Subscribers</h1>
          <p className="text-ink/60 text-sm font-body mt-1">{subscribers.length} email{subscribers.length === 1 ? '' : 's'} collected.</p>
        </div>
        {subscribers.length > 0 && (
          <button onClick={copyAll} className="bg-basil/10 hover:bg-basil/20 text-basil text-xs font-bold px-4 py-2 rounded-lg transition-all">
            Copy all emails
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-ink/50 text-sm font-body mt-6">Loading…</p>
      ) : subscribers.length === 0 ? (
        <p className="text-ink/50 text-sm font-body mt-6">No subscribers yet.</p>
      ) : (
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl shadow-sm mt-6 overflow-hidden">
          {subscribers.map((s, i) => (
            <div key={s._id} className={`flex items-center justify-between p-4 ${i !== subscribers.length - 1 ? 'border-b border-ink/5' : ''}`}>
              <p className="text-sm font-semibold text-ink">{s.email}</p>
              <p className="text-ink/40 text-[11px]">{new Date(s.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
