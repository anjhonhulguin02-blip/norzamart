"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { fileToBase64, uploadIfNew } from '@/lib/uploadImage';

const tabs = [
  { id: 'personal', label: 'Personal Information', icon: '👤' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'address', label: 'Address', icon: '📍' },
  { id: 'delivery', label: 'Delivery Preferences', icon: '🚚' },
  { id: 'payment', label: 'Payment Methods', icon: '💳' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'seller', label: 'Seller Information', icon: '🛒' },
  { id: 'privacy', label: 'Privacy', icon: '⚙️' },
];

export default function ProfileSettingsPage() {
  const { update } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [barangays, setBarangays] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/barangays')
      .then((res) => res.json())
      .then((data) => setBarangays((data.barangays || []).map((b: any) => b.name)));

    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const [user, setUser] = useState<any>(null);
  const [personal, setPersonal] = useState({ name: '', email: '', phone: '' });
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({ address: '', barangay: '' });
  const [delivery, setDelivery] = useState({ preferredDeliveryTime: 'anytime', contactlessDelivery: false, deliveryNotes: '' });
  const [payment, setPayment] = useState({ preferredPayment: 'cod' });
  const [notifications, setNotifications] = useState({ notifyOrderUpdates: true, notifyChatMessages: true, notifyPromotions: false });
  const [privacy, setPrivacy] = useState({ profileVisible: true });

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [seller, setSeller] = useState<any>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [sellerForm, setSellerForm] = useState({
    storeName: '', ownerName: '', contactNumber: '', email: '', address: '', barangay: '', storeDescription: '',
    businessHours: '', facebook: '', instagram: '', website: '', estimatedDeliveryTime: '',
  });
  const [deliveryBarangays, setDeliveryBarangays] = useState<string[]>([]);
  const [sellerLogo, setSellerLogo] = useState<string | null>(null);
  const [sellerBanner, setSellerBanner] = useState<string | null>(null);

  const [status, setStatus] = useState<{ tab: string; type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (res.ok && data.user) {
        const u = data.user;
        setUser(u);
        setPersonal({ name: u.name || '', email: u.email || '', phone: u.phone || '' });
        setAvatar(u.avatar || null);
        setAddressForm({ address: u.settings?.address || '', barangay: u.settings?.barangay || '' });
        setDelivery({
          preferredDeliveryTime: u.settings?.preferredDeliveryTime || 'anytime',
          contactlessDelivery: u.settings?.contactlessDelivery || false,
          deliveryNotes: u.settings?.deliveryNotes || '',
        });
        setPayment({ preferredPayment: u.settings?.preferredPayment || 'cod' });
        setNotifications({
          notifyOrderUpdates: u.settings?.notifyOrderUpdates ?? true,
          notifyChatMessages: u.settings?.notifyChatMessages ?? true,
          notifyPromotions: u.settings?.notifyPromotions ?? false,
        });
        setPrivacy({ profileVisible: u.settings?.profileVisible ?? true });
      }

      const sellerRes = await fetch('/api/seller/me');
      const sellerData = await sellerRes.json();
      if (sellerData.isSeller) {
        setIsSeller(true);
        setSeller(sellerData.seller);
        const s = sellerData.seller;
        setSellerForm({
          storeName: s.storeName || '', ownerName: s.ownerName || '', contactNumber: s.contactNumber || '',
          email: s.email || '', address: s.address || '', barangay: s.barangay || '', storeDescription: s.storeDescription || '',
          businessHours: s.businessHours || '', facebook: s.facebook || '', instagram: s.instagram || '', website: s.website || '',
          estimatedDeliveryTime: s.estimatedDeliveryTime || '',
        });
        setSellerLogo(s.storeLogo || null);
        setSellerBanner(s.storeBanner || null);
        setDeliveryBarangays(s.deliveryBarangays || []);
      }

      setLoading(false);
    };
    load();
  }, []);

  const showStatus = (tab: string, type: 'success' | 'error', text: string) => {
    setStatus({ tab, type, text });
    setTimeout(() => setStatus(null), 4000);
  };

  const savePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const uploadedAvatar = await uploadIfNew(avatar, 'avatars');
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...personal, avatar: uploadedAvatar }),
      });
      const data = await res.json();
      if (!res.ok) {
        showStatus('personal', 'error', data.message || 'Something went wrong.');
      } else {
        setAvatar(uploadedAvatar);
        await update({ name: personal.name, avatar: uploadedAvatar });
        showStatus('personal', 'success', 'Personal information updated!');
      }
    } catch (err: any) {
      showStatus('personal', 'error', err?.message || 'Unable to connect to the server.');
    }
    setSaving(false);
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showStatus('security', 'error', 'New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showStatus('security', 'error', data.message || 'Something went wrong.');
      } else {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showStatus('security', 'success', 'Password changed successfully!');
      }
    } catch {
      showStatus('security', 'error', 'Unable to connect to the server.');
    }
    setSaving(false);
  };

  const saveSettingsSection = async (tab: string, settings: any, successText: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) {
        showStatus(tab, 'error', data.message || 'Something went wrong.');
      } else {
        showStatus(tab, 'success', successText);
      }
    } catch {
      showStatus(tab, 'error', 'Unable to connect to the server.');
    }
    setSaving(false);
  };

  const saveSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const [uploadedLogo, uploadedBanner] = await Promise.all([
        uploadIfNew(sellerLogo, 'sellers'),
        uploadIfNew(sellerBanner, 'sellers'),
      ]);
      const res = await fetch('/api/seller/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sellerForm, storeLogo: uploadedLogo, storeBanner: uploadedBanner, deliveryBarangays }),
      });
      const data = await res.json();
      if (!res.ok) {
        showStatus('seller', 'error', data.message || 'Something went wrong.');
      } else {
        setSellerLogo(uploadedLogo);
        setSellerBanner(uploadedBanner);
        showStatus('seller', 'success', 'Store information updated!');
      }
    } catch (err: any) {
      showStatus('seller', 'error', err?.message || 'Unable to connect to the server.');
    }
    setSaving(false);
  };

  const StatusBanner = ({ tab }: { tab: string }) => {
    if (!status || status.tab !== tab) return null;
    return (
      <div className={`text-xs font-semibold rounded-xl p-3 mb-5 text-center ${
        status.type === 'success' ? 'bg-basil/10 border border-basil/20 text-basil' : 'bg-tomato/10 border border-tomato/20 text-tomato'
      }`}>
        {status.text}
      </div>
    );
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-all relative ${checked ? 'bg-basil' : 'bg-ink/15'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${checked ? 'left-5.5' : 'left-0.5'}`} style={{ left: checked ? '22px' : '2px' }} />
    </button>
  );

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
        <Navbar />
        <p className="text-ink/50 text-sm font-body p-10">Loading profile…</p>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-semibold text-basil mb-6">Account Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Sidebar tabs */}
          <div className="md:col-span-1 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map((tab) => {
              if (tab.id === 'seller' && !isSeller) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all text-left ${
                    activeTab === tab.id ? 'bg-basil text-white shadow-md shadow-basil/20' : 'bg-white/50 text-ink/70 hover:bg-basil/5'
                  }`}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-8 shadow-lg"
            >

              {/* PERSONAL */}
              {activeTab === 'personal' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-basil mb-5">👤 Personal Information</h2>
                  <StatusBanner tab="personal" />
                  <form onSubmit={savePersonal} className="flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-basil/10 flex items-center justify-center overflow-hidden shrink-0">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-basil">{(personal.name || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink/70 mb-1">Profile Photo</label>
                        <input type="file" accept="image/*"
                          onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAvatar(await fileToBase64(f)); }}
                          className="text-xs text-ink/70" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">Full Name</label>
                      <input required value={personal.name} onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                        className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">Email Address</label>
                      <input type="email" required value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                        className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                      {user && (
                        user.emailVerified ? (
                          <p className="text-basil text-xs font-semibold mt-1.5">✔️ Verified</p>
                        ) : (
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-amber-600 text-xs font-semibold">⚠️ Not verified — required to place orders.</p>
                            {resendMessage ? (
                              <span className="text-basil text-xs font-semibold">{resendMessage}</span>
                            ) : (
                              <button
                                type="button"
                                disabled={resendingVerification}
                                onClick={async () => {
                                  setResendingVerification(true);
                                  try {
                                    const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
                                    const data = await res.json();
                                    setResendMessage(data.message);
                                  } catch {
                                    setResendMessage('Unable to connect to the server.');
                                  }
                                  setResendingVerification(false);
                                }}
                                className="text-basil text-xs font-bold underline disabled:opacity-50"
                              >
                                {resendingVerification ? 'Sending…' : 'Resend email'}
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">Phone Number</label>
                      <input value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                        placeholder="09XX XXX XXXX"
                        className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                    </div>

                    <button type="submit" disabled={saving}
                      className="bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md shadow-basil/20 text-sm transition-all mt-2 self-start px-8">
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </form>
                </>
              )}

              {/* SECURITY */}
              {activeTab === 'security' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-basil mb-5">🔒 Security</h2>
                  <StatusBanner tab="security" />
                  <form onSubmit={savePassword} className="flex flex-col gap-5 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">Current Password</label>
                      <input type="password" required value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">New Password</label>
                      <input type="password" required minLength={8} value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                      <p className="text-ink/40 text-[11px] mt-1">At least 8 characters.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">Confirm New Password</label>
                      <input type="password" required value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                    </div>
                    <button type="submit" disabled={saving}
                      className="bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md shadow-basil/20 text-sm transition-all mt-2 self-start px-8">
                      {saving ? 'Updating…' : 'Update Password'}
                    </button>
                  </form>
                </>
              )}

              {/* ADDRESS */}
              {activeTab === 'address' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-basil mb-5">📍 Address</h2>
                  <StatusBanner tab="address" />
                  <form onSubmit={(e) => { e.preventDefault(); saveSettingsSection('address', addressForm, 'Address updated!'); }} className="flex flex-col gap-5 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">Barangay</label>
                      <select value={addressForm.barangay} onChange={(e) => setAddressForm({ ...addressForm, barangay: e.target.value })}
                        className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
                        <option value="">Select barangay</option>
                        {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">Full Address</label>
                      <textarea rows={3} value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                        placeholder="House no., street, landmark"
                        className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                    </div>
                    <button type="submit" disabled={saving}
                      className="bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md shadow-basil/20 text-sm transition-all mt-2 self-start px-8">
                      {saving ? 'Saving…' : 'Save Address'}
                    </button>
                  </form>
                </>
              )}

              {/* DELIVERY */}
              {activeTab === 'delivery' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-basil mb-5">🚚 Delivery Preferences</h2>
                  <StatusBanner tab="delivery" />
                  <form onSubmit={(e) => { e.preventDefault(); saveSettingsSection('delivery', delivery, 'Delivery preferences updated!'); }} className="flex flex-col gap-5 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">Preferred Delivery Time</label>
                      <select value={delivery.preferredDeliveryTime} onChange={(e) => setDelivery({ ...delivery, preferredDeliveryTime: e.target.value })}
                        className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
                        <option value="anytime">Anytime</option>
                        <option value="morning">Morning (8AM–12NN)</option>
                        <option value="afternoon">Afternoon (12NN–5PM)</option>
                        <option value="evening">Evening (5PM–8PM)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between bg-white/50 border border-ink/10 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">Contactless Delivery</p>
                        <p className="text-ink/50 text-xs">Leave orders at the door.</p>
                      </div>
                      <Toggle checked={delivery.contactlessDelivery} onChange={(v) => setDelivery({ ...delivery, contactlessDelivery: v })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1">Delivery Notes</label>
                      <textarea rows={2} value={delivery.deliveryNotes} onChange={(e) => setDelivery({ ...delivery, deliveryNotes: e.target.value })}
                        placeholder="e.g. Gate code, landmark instructions"
                        className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                    </div>
                    <button type="submit" disabled={saving}
                      className="bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md shadow-basil/20 text-sm transition-all mt-2 self-start px-8">
                      {saving ? 'Saving…' : 'Save Preferences'}
                    </button>
                  </form>
                </>
              )}

              {/* PAYMENT */}
              {activeTab === 'payment' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-basil mb-5">💳 Payment Methods</h2>
                  <StatusBanner tab="payment" />
                  <p className="text-ink/50 text-xs font-body mb-5">Online payments are coming soon. For now, choose your preferred method for when checkout is available.</p>
                  <form onSubmit={(e) => { e.preventDefault(); saveSettingsSection('payment', payment, 'Payment preference saved!'); }} className="flex flex-col gap-3 max-w-md">
                    {[
                      { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
                      { value: 'gcash', label: 'GCash', icon: '📱' },
                      { value: 'bank', label: 'Bank Transfer', icon: '🏦' },
                    ].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                        payment.preferredPayment === opt.value ? 'border-basil bg-basil/5' : 'border-ink/10 bg-white/50'
                      }`}>
                        <input type="radio" name="payment" checked={payment.preferredPayment === opt.value}
                          onChange={() => setPayment({ preferredPayment: opt.value })} className="accent-basil" />
                        <span>{opt.icon}</span>
                        <span className="text-sm font-semibold text-ink">{opt.label}</span>
                      </label>
                    ))}
                    <button type="submit" disabled={saving}
                      className="bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md shadow-basil/20 text-sm transition-all mt-2 self-start px-8">
                      {saving ? 'Saving…' : 'Save Preference'}
                    </button>
                  </form>
                </>
              )}

              {/* NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-basil mb-5">🔔 Notifications</h2>
                  <StatusBanner tab="notifications" />
                  <div className="flex flex-col gap-3 max-w-md">
                    {[
                      { key: 'notifyOrderUpdates', label: 'Order Updates', desc: 'Status changes on your orders.' },
                      { key: 'notifyChatMessages', label: 'Chat Messages', desc: 'New messages from sellers.' },
                      { key: 'notifyPromotions', label: 'Promotions & Offers', desc: 'Deals and announcements.' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between bg-white/50 border border-ink/10 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">{item.label}</p>
                          <p className="text-ink/50 text-xs">{item.desc}</p>
                        </div>
                        <Toggle
                          checked={(notifications as any)[item.key]}
                          onChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => saveSettingsSection('notifications', notifications, 'Notification settings saved!')}
                      disabled={saving}
                      className="bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md shadow-basil/20 text-sm transition-all mt-2 self-start px-8">
                      {saving ? 'Saving…' : 'Save Settings'}
                    </button>
                  </div>
                </>
              )}

              {/* SELLER */}
              {activeTab === 'seller' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-basil mb-5">🛒 Seller Information</h2>
                  <StatusBanner tab="seller" />

                  {!isSeller ? (
                    <div className="text-center py-8">
                      <span className="text-4xl block mb-3">🏬</span>
                      <p className="text-ink/60 text-sm font-body mb-4">You don't have a store yet.</p>
                      <Link href="/seller/register"
                        className="inline-block bg-basil hover:bg-basil-light text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all">
                        Become a Seller
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={() => router.push('/seller/dashboard')}
                          className="text-basil bg-basil/10 hover:bg-basil/20 font-bold text-xs px-4 py-2 rounded-lg transition-all"
                        >
                          Go to Seller Dashboard →
                        </button>
                      </div>
                      <form onSubmit={saveSeller} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-basil/10 flex items-center justify-center overflow-hidden shrink-0">
                            {sellerLogo ? (
                              <img src={sellerLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">🏬</span>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1">Store Logo</label>
                            <input type="file" accept="image/*"
                              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setSellerLogo(await fileToBase64(f)); }}
                              className="text-xs text-ink/70" />
                          </div>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-basil/10 flex items-center justify-center overflow-hidden shrink-0">
                            {sellerBanner ? (
                              <img src={sellerBanner} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">🖼️</span>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1">Store Banner</label>
                            <input type="file" accept="image/*"
                              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setSellerBanner(await fileToBase64(f)); }}
                              className="text-xs text-ink/70" />
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-ink/70 mb-1">Store Name</label>
                          <input required value={sellerForm.storeName} onChange={(e) => setSellerForm({ ...sellerForm, storeName: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Owner Name</label>
                          <input required value={sellerForm.ownerName} onChange={(e) => setSellerForm({ ...sellerForm, ownerName: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Contact Number</label>
                          <input required value={sellerForm.contactNumber} onChange={(e) => setSellerForm({ ...sellerForm, contactNumber: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Store Email</label>
                          <input type="email" required value={sellerForm.email} onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Barangay</label>
                          <select required value={sellerForm.barangay} onChange={(e) => setSellerForm({ ...sellerForm, barangay: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
                            {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-ink/70 mb-1">Address</label>
                          <input required value={sellerForm.address} onChange={(e) => setSellerForm({ ...sellerForm, address: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Estimated Delivery Time</label>
                          <select value={sellerForm.estimatedDeliveryTime} onChange={(e) => setSellerForm({ ...sellerForm, estimatedDeliveryTime: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
                            <option value="">Not sure yet</option>
                            <option value="Same-day">Same-day</option>
                            <option value="1-2 days">1-2 days</option>
                            <option value="2-3 days">2-3 days</option>
                            <option value="3-5 days">3-5 days</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Business Hours</label>
                          <input placeholder="e.g. Mon–Sat, 7AM–7PM" value={sellerForm.businessHours} onChange={(e) => setSellerForm({ ...sellerForm, businessHours: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Facebook</label>
                          <input placeholder="https://facebook.com/yourstore" value={sellerForm.facebook} onChange={(e) => setSellerForm({ ...sellerForm, facebook: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Instagram</label>
                          <input placeholder="https://instagram.com/yourstore" value={sellerForm.instagram} onChange={(e) => setSellerForm({ ...sellerForm, instagram: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Website</label>
                          <input placeholder="https://yourstore.com" value={sellerForm.website} onChange={(e) => setSellerForm({ ...sellerForm, website: e.target.value })}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-ink/70 mb-2">Delivery Coverage</label>
                          <p className="text-ink/50 text-[11px] mb-2">Select the barangays you deliver to. Leave empty to deliver everywhere.</p>
                          <div className="flex flex-wrap gap-2">
                            {barangays.map((b) => {
                              const isSelected = deliveryBarangays.includes(b);
                              return (
                                <button
                                  key={b}
                                  type="button"
                                  onClick={() => setDeliveryBarangays((prev) =>
                                    isSelected ? prev.filter((x) => x !== b) : [...prev, b]
                                  )}
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                                    isSelected ? 'bg-basil text-white border-basil' : 'bg-white text-ink/60 border-ink/10 hover:border-basil/40'
                                  }`}
                                >
                                  {b}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button type="submit" disabled={saving}
                          className="md:col-span-2 bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md shadow-basil/20 text-sm transition-all mt-2 self-start px-8">
                          {saving ? 'Saving…' : 'Save Store Info'}
                        </button>
                      </form>
                    </>
                  )}
                </>
              )}

              {/* PRIVACY */}
              {activeTab === 'privacy' && (
                <>
                  <h2 className="font-display text-xl font-semibold text-basil mb-5">⚙️ Privacy</h2>
                  <StatusBanner tab="privacy" />
                  <div className="flex flex-col gap-4 max-w-md">
                    <div className="flex items-center justify-between bg-white/50 border border-ink/10 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">Show my name to sellers</p>
                        <p className="text-ink/50 text-xs">Sellers can see your name in chat and orders.</p>
                      </div>
                      <Toggle checked={privacy.profileVisible} onChange={(v) => setPrivacy({ profileVisible: v })} />
                    </div>
                    <button
                      onClick={() => saveSettingsSection('privacy', privacy, 'Privacy settings saved!')}
                      disabled={saving}
                      className="bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md shadow-basil/20 text-sm transition-all self-start px-8">
                      {saving ? 'Saving…' : 'Save Settings'}
                    </button>

                    <div className="border-t border-ink/10 mt-4 pt-5">
                      <p className="text-sm font-semibold text-tomato mb-1">Deactivate Account</p>
                      <p className="text-ink/50 text-xs mb-3">This feature is coming soon.</p>
                      <button disabled title="Coming soon"
                        className="text-tomato bg-tomato/10 font-bold text-xs px-4 py-2 rounded-lg cursor-not-allowed opacity-60">
                        Request Deactivation
                      </button>
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}