"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { fileToBase64, uploadIfNew } from '@/lib/uploadImage';

export default function SellerRegisterPage() {
  const router = useRouter();
  const { data: session, update } = useSession();

  const [form, setForm] = useState({
    storeName: '', ownerName: '', contactNumber: '',
    email: session?.user?.email || '', address: '', barangay: '',
    storeDescription: '', businessHours: '', facebook: '', instagram: '', website: '', estimatedDeliveryTime: '',
  });
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeBanner, setStoreBanner] = useState<string | null>(null);
  const [governmentId, setGovernmentId] = useState<string | null>(null);
  const [govIdConsent, setGovIdConsent] = useState(false);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/barangays')
      .then((res) => res.json())
      .then((data) => setBarangays((data.barangays || []).map((b: any) => b.name)));
  }, []);

  const update_ = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!governmentId) {
      setError('Please upload a Government ID.');
      return;
    }
    if (!govIdConsent) {
      setError('Please consent to government ID verification to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const [uploadedLogo, uploadedBanner, uploadedGovId] = await Promise.all([
        uploadIfNew(storeLogo, 'sellers'),
        uploadIfNew(storeBanner, 'sellers'),
        uploadIfNew(governmentId, 'government-ids'),
      ]);

      const res = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, storeLogo: uploadedLogo, storeBanner: uploadedBanner, governmentId: uploadedGovId }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.alreadyRegistered) {
          router.push('/seller/dashboard');
          return;
        }
        setError(data.message || 'Something went wrong during registration.');
        setIsSubmitting(false);
        return;
      }

      // Triggers the jwt callback to re-read this user's role from the
      // database (it's already "seller" there — the API route above set it)
      // rather than trusting a role value from this client, which is how a
      // buyer could previously self-promote to admin via update({ role }).
      await update();
      router.push('/seller/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to the server.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream-mist py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto bg-white/70 backdrop-blur-xl border border-white/70 rounded-[2rem] shadow-xl p-8 md:p-10"
      >
        <span className="inline-block bg-tomato text-white text-[10px] uppercase font-black tracking-wider px-3 py-1.5 rounded-full">
          Become a Seller
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-basil mt-4">
          Open your store on NorzaMart
        </h1>
        <p className="text-ink/60 text-sm mt-2 font-body">
          Fill in the details below to start selling in your barangay.
        </p>

        {error && (
          <div className="bg-tomato/10 border border-tomato/20 text-tomato text-xs font-semibold rounded-xl p-3 mt-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div className="md:col-span-2">
            <label htmlFor="storeName" className="block text-xs font-bold text-ink/70 mb-1">Store Name *</label>
            <input id="storeName" required value={form.storeName} onChange={(e) => update_('storeName', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label htmlFor="storeLogo" className="block text-xs font-bold text-ink/70 mb-1">Store Logo</label>
            <input id="storeLogo" type="file" accept="image/*"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setStoreLogo(await fileToBase64(f)); }}
              className="w-full text-xs text-ink/70" />
          </div>

          <div>
            <label htmlFor="storeBanner" className="block text-xs font-bold text-ink/70 mb-1">Store Banner</label>
            <input id="storeBanner" type="file" accept="image/*"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setStoreBanner(await fileToBase64(f)); }}
              className="w-full text-xs text-ink/70" />
          </div>

          <div>
            <label htmlFor="governmentId" className="block text-xs font-bold text-ink/70 mb-1">Government ID *</label>
            <p className="text-[11px] text-ink/50 mb-2">
              Used only to verify your identity before approving your store. Reviewed solely by NorzaMart admins,
              stored privately (never publicly accessible), and kept for as long as your seller account is active.
            </p>
            <input id="governmentId" type="file" accept="image/*" required
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setGovernmentId(await fileToBase64(f)); }}
              className="w-full text-xs text-ink/70" />
            <label htmlFor="govIdConsent" className="flex items-start gap-2 mt-2 text-[11px] text-ink/60 cursor-pointer">
              <input
                id="govIdConsent"
                type="checkbox"
                required
                checked={govIdConsent}
                onChange={(e) => setGovIdConsent(e.target.checked)}
                className="mt-0.5"
              />
              I consent to NorzaMart collecting and reviewing this ID for seller verification purposes.
            </label>
          </div>

          <div>
            <label htmlFor="ownerName" className="block text-xs font-bold text-ink/70 mb-1">Owner Name *</label>
            <input id="ownerName" required value={form.ownerName} onChange={(e) => update_('ownerName', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label htmlFor="contactNumber" className="block text-xs font-bold text-ink/70 mb-1">Contact Number *</label>
            <input id="contactNumber" required value={form.contactNumber} onChange={(e) => update_('contactNumber', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label htmlFor="sellerEmail" className="block text-xs font-bold text-ink/70 mb-1">Email *</label>
            <input id="sellerEmail" type="email" required value={form.email} onChange={(e) => update_('email', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label htmlFor="sellerBarangay" className="block text-xs font-bold text-ink/70 mb-1">Barangay *</label>
            <select id="sellerBarangay" required value={form.barangay} onChange={(e) => update_('barangay', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
              <option value="">Select barangay</option>
              {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="sellerAddress" className="block text-xs font-bold text-ink/70 mb-1">Address *</label>
            <input id="sellerAddress" required value={form.address} onChange={(e) => update_('address', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="storeDescription" className="block text-xs font-bold text-ink/70 mb-1">Store Description</label>
            <textarea id="storeDescription" rows={3} value={form.storeDescription} onChange={(e) => update_('storeDescription', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label htmlFor="estimatedDeliveryTime" className="block text-xs font-bold text-ink/70 mb-1">Estimated Delivery Time</label>
            <select id="estimatedDeliveryTime" value={form.estimatedDeliveryTime} onChange={(e) => update_('estimatedDeliveryTime', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
              <option value="">Not sure yet</option>
              <option value="Same-day">Same-day</option>
              <option value="1-2 days">1-2 days</option>
              <option value="2-3 days">2-3 days</option>
              <option value="3-5 days">3-5 days</option>
            </select>
          </div>

          <div>
            <label htmlFor="businessHours" className="block text-xs font-bold text-ink/70 mb-1">Business Hours</label>
            <input id="businessHours" placeholder="e.g. Mon–Sat, 7AM–7PM" value={form.businessHours} onChange={(e) => update_('businessHours', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label htmlFor="facebook" className="block text-xs font-bold text-ink/70 mb-1">Facebook (optional)</label>
            <input id="facebook" placeholder="https://facebook.com/yourstore" value={form.facebook} onChange={(e) => update_('facebook', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label htmlFor="instagram" className="block text-xs font-bold text-ink/70 mb-1">Instagram (optional)</label>
            <input id="instagram" placeholder="https://instagram.com/yourstore" value={form.instagram} onChange={(e) => update_('instagram', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label htmlFor="website" className="block text-xs font-bold text-ink/70 mb-1">Website (optional)</label>
            <input id="website" placeholder="https://yourstore.com" value={form.website} onChange={(e) => update_('website', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <button type="submit" disabled={isSubmitting}
            className="md:col-span-2 bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-md shadow-basil/20 mt-2 text-sm transition-all">
            {isSubmitting ? 'Submitting…' : 'Submit Application →'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}