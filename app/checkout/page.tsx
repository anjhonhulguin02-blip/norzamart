"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { fileToBase64, uploadIfNew } from '@/lib/uploadImage';

interface SavedAddress {
  _id: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  barangay: string;
  isDefault: boolean;
}

interface CartItem {
  _id: string;
  quantity: number;
  product: {
    _id: string;
    name: string;
    price: number;
    unit: string;
    image?: string;
    seller?: {
      storeName: string;
      estimatedDeliveryTime?: string;
      gcashNumber?: string;
      gcashName?: string;
      bankName?: string;
      bankAccountNumber?: string;
      bankAccountName?: string;
    };
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const [form, setForm] = useState({ deliveryAddress: '', deliveryBarangay: '', paymentMethod: 'cod' });
  const [barangays, setBarangays] = useState<{ _id: string; name: string }[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [buyNow, setBuyNow] = useState<{ productId: string; quantity: number } | null>(null);
  const [buyNowRequested, setBuyNowRequested] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/barangays').then((res) => res.json()).then((data) => setBarangays(data.barangays || []));
  }, []);

  const selectAddress = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'new') return;
    const a = savedAddresses.find((sa) => sa._id === id);
    if (a) setForm((f) => ({ ...f, deliveryAddress: a.address, deliveryBarangay: a.barangay }));
  };

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams(window.location.search);
      const buyNowProductId = params.get('buyNow') === '1' ? params.get('productId') : null;
      const buyNowQuantity = Math.max(1, Number(params.get('quantity')) || 1);
      setBuyNowRequested(!!buyNowProductId);

      const [cartOrProductRes, profileRes, addressRes] = await Promise.all([
        buyNowProductId
          ? fetch('/api/products/batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: [buyNowProductId] }),
            })
          : fetch('/api/cart'),
        fetch('/api/user/profile'),
        fetch('/api/addresses'),
      ]);
      const cartOrProductData = await cartOrProductRes.json();
      const profileData = await profileRes.json();
      const addressData = await addressRes.json();
      const addresses: SavedAddress[] = addressData.addresses || [];

      if (buyNowProductId) {
        const product = (cartOrProductData.products || [])[0];
        if (product) {
          const qty = Math.min(buyNowQuantity, product.stock ?? buyNowQuantity);
          setBuyNow({ productId: buyNowProductId, quantity: qty });
          setItems([{ _id: 'buy-now', quantity: qty, product }]);
        }
      } else {
        setItems(cartOrProductData.items || []);
      }
      setSavedAddresses(addresses);

      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
        setForm({
          deliveryAddress: defaultAddress.address,
          deliveryBarangay: defaultAddress.barangay,
          paymentMethod: profileData.user?.settings?.preferredPayment || 'cod',
        });
      } else {
        setForm({
          deliveryAddress: profileData.user?.settings?.address || '',
          deliveryBarangay: profileData.user?.settings?.barangay || '',
          paymentMethod: profileData.user?.settings?.preferredPayment || 'cod',
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const savedCode = localStorage.getItem('norzamart_coupon');
    if (!savedCode || items.length === 0) return;

    const cartSubtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: savedCode, subtotal: cartSubtotal }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setCouponCode(data.code);
          setDiscount(data.discount);
        } else {
          localStorage.removeItem('norzamart_coupon');
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Group items by seller for the summary
  const groups = items.reduce((acc: Record<string, { sellerName: string; estimatedDeliveryTime?: string; seller?: CartItem['product']['seller']; items: CartItem[] }>, item) => {
    const sellerId = item.product.seller ? (item.product.seller as any)._id || 'unknown' : 'unknown';
    if (!acc[sellerId]) acc[sellerId] = {
      sellerName: item.product.seller?.storeName || 'Store',
      estimatedDeliveryTime: item.product.seller?.estimatedDeliveryTime,
      seller: item.product.seller,
      items: [],
    };
    acc[sellerId].items.push(item);
    return acc;
  }, {});

  const hasAnySellerPaymentDetails = Object.values(groups).some(
    (g) => g.seller?.gcashNumber || g.seller?.bankAccountNumber
  );

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const sellerCount = Object.keys(groups).length;
  const estimatedDeliveryFee = Object.values(groups).reduce((sum, g) => {
    const groupSubtotal = g.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    return sum + (groupSubtotal >= 500 ? 0 : 50);
  }, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRequiresVerification(false);
    setResendMessage('');

    if (form.paymentMethod !== 'cod' && (!paymentReference.trim() || !paymentProofImage)) {
      setError('Please enter your payment reference number and upload a screenshot of your payment.');
      return;
    }

    setPlacing(true);

    try {
      const uploadedProof = form.paymentMethod !== 'cod'
        ? await uploadIfNew(paymentProofImage, 'payment-proof')
        : undefined;

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          couponCode: couponCode || undefined,
          buyNow: buyNow || undefined,
          paymentReference: form.paymentMethod !== 'cod' ? paymentReference.trim() : undefined,
          paymentProofImage: uploadedProof,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
        setRequiresVerification(!!data.requiresVerification);
        setPlacing(false);
        return;
      }

      if (!buyNow) {
        localStorage.removeItem('norzamart_coupon');
        window.dispatchEvent(new Event('cart-updated'));
      }
      router.push('/dashboard/orders?placed=1');
    } catch {
      setError('Unable to connect to the server.');
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
        <Navbar />
        <p className="text-ink/50 text-sm font-body p-10">Loading checkout…</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <span className="text-4xl block mb-3">🛒</span>
          <p className="text-ink/60 font-body">
            {buyNowRequested ? 'This product is no longer available.' : 'Your basket is empty.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-semibold text-basil mb-6">Checkout</h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-5">

            <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-basil mb-4">📍 Delivery Address</h2>

              {savedAddresses.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  {savedAddresses.map((a) => (
                    <label key={a._id} className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                      selectedAddressId === a._id ? 'border-basil bg-basil/5' : 'border-ink/10 bg-white/50'
                    }`}>
                      <input type="radio" name="savedAddress" checked={selectedAddressId === a._id}
                        onChange={() => selectAddress(a._id)} className="accent-basil mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-ink">
                          {a.label} {a.isDefault && <span className="text-[10px] font-bold text-basil bg-basil/10 px-2 py-0.5 rounded-full ml-1">Default</span>}
                        </p>
                        <p className="text-ink/60 text-xs font-body mt-0.5">{a.recipientName} • {a.phone}</p>
                        <p className="text-ink/60 text-xs font-body">{a.address}, {a.barangay}</p>
                      </div>
                    </label>
                  ))}
                  <label className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                    selectedAddressId === 'new' ? 'border-basil bg-basil/5' : 'border-ink/10 bg-white/50'
                  }`}>
                    <input type="radio" name="savedAddress" checked={selectedAddressId === 'new'}
                      onChange={() => selectAddress('new')} className="accent-basil" />
                    <span className="text-sm font-semibold text-ink">Enter a different address</span>
                  </label>
                </div>
              )}

              {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Barangay</label>
                    <select required value={form.deliveryBarangay} onChange={(e) => setForm({ ...form, deliveryBarangay: e.target.value })}
                      className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
                      <option value="">Select barangay</option>
                      {barangays.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Full Address</label>
                    <textarea required rows={2} value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                      placeholder="House no., street, landmark"
                      className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                  </div>
                  <a href="/dashboard/addresses" className="text-xs font-bold text-basil hover:underline self-start">
                    + Save this as a new address for next time
                  </a>
                </div>
              )}
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-basil mb-4">💳 Payment Method</h2>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
                  { value: 'gcash', label: 'GCash', icon: '📱' },
                  { value: 'bank', label: 'Bank Transfer', icon: '🏦' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${
                    form.paymentMethod === opt.value ? 'border-basil bg-basil/5' : 'border-ink/10 bg-white/50'
                  }`}>
                    <input type="radio" name="payment" checked={form.paymentMethod === opt.value}
                      onChange={() => setForm({ ...form, paymentMethod: opt.value })} className="accent-basil" />
                    <span>{opt.icon}</span>
                    <span className="text-sm font-semibold text-ink">{opt.label}</span>
                  </label>
                ))}
              </div>

              {form.paymentMethod !== 'cod' && (
                <div className="mt-4 pt-4 border-t border-ink/10 flex flex-col gap-4">
                  {hasAnySellerPaymentDetails ? (
                    <div className="flex flex-col gap-2">
                      {Object.entries(groups).map(([sellerId, group]) => {
                        const detail = form.paymentMethod === 'gcash'
                          ? group.seller?.gcashNumber && `GCash: ${group.seller.gcashNumber} (${group.seller.gcashName || group.sellerName})`
                          : group.seller?.bankAccountNumber && `${group.seller.bankName || 'Bank'}: ${group.seller.bankAccountNumber} (${group.seller.bankAccountName || group.sellerName})`;
                        return (
                          <div key={sellerId} className="bg-basil/5 border border-basil/20 rounded-xl px-4 py-2.5">
                            <p className="text-xs font-bold text-ink">{group.sellerName}</p>
                            <p className="text-ink/70 text-xs font-body mt-0.5">
                              {detail || "This seller hasn't added their payment details yet — check with them via chat."}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-amber-700 text-xs font-semibold bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                      The seller(s) in your basket haven't added payment details yet. Please confirm payment details with them via chat before sending money.
                    </p>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Payment Reference Number</label>
                    <input required value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. GCash reference number"
                      className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Proof of Payment (screenshot)</label>
                    {paymentProofImage ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-ink/10">
                        <img src={paymentProofImage} alt="Payment proof" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setPaymentProofImage(null)}
                          className="absolute top-0 right-0 bg-tomato text-white w-5 h-5 text-xs flex items-center justify-center rounded-bl-md">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <input type="file" accept="image/*" required
                        onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPaymentProofImage(await fileToBase64(f)); }}
                        className="text-xs text-ink/70" />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-basil mb-4">🛍 Items ({sellerCount} seller{sellerCount > 1 ? 's' : ''})</h2>
              {Object.entries(groups).map(([sellerId, group]) => (
                <div key={sellerId} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-ink/60">{group.sellerName}</p>
                    <p className="text-basil text-[11px] font-semibold">
                      🕐 {group.estimatedDeliveryTime || '1-3 days'}
                    </p>
                  </div>
                  {group.items.map((item) => (
                    <div key={item._id} className="flex items-center gap-3 py-1.5">
                      <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} className="max-w-full max-h-full object-contain" />
                        ) : <span className="text-lg">🛒</span>}
                      </div>
                      <p className="flex-1 text-xs font-semibold text-ink truncate">{item.product.name} × {item.quantity}</p>
                      <p className="font-mono text-xs font-bold text-ink">₱{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm h-max">
            <h2 className="font-display text-lg font-semibold text-basil mb-4">Order Summary</h2>
            <div className="flex justify-between text-sm text-ink/70 font-body mb-2">
              <span>Subtotal</span>
              <span className="font-mono">₱{subtotal.toFixed(2)}</span>
            </div>
            {couponCode && discount > 0 && (
              <div className="flex justify-between text-sm text-basil font-body mb-2">
                <span>🎟️ {couponCode}</span>
                <span className="font-mono">−₱{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-ink/70 font-body mb-4">
              <span>Delivery ({sellerCount} store{sellerCount > 1 ? 's' : ''})</span>
              <span className="font-mono">₱{estimatedDeliveryFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-ink/10 pt-4 flex justify-between font-bold text-ink mb-5">
              <span>Total</span>
              <span className="font-mono">₱{Math.max(subtotal + estimatedDeliveryFee - discount, 0).toFixed(2)}</span>
            </div>

            {error && (
              <div className="mb-3 text-center">
                <p className="text-tomato text-xs font-semibold">{error}</p>
                {requiresVerification && (
                  resendMessage ? (
                    <p className="text-basil text-xs font-semibold mt-1">{resendMessage}</p>
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
                      className="text-basil text-xs font-bold underline mt-1 disabled:opacity-50"
                    >
                      {resendingVerification ? 'Sending…' : 'Resend verification email'}
                    </button>
                  )
                )}
              </div>
            )}

            <button type="submit" disabled={placing}
              className="w-full bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md shadow-basil/20 text-sm transition-all">
              {placing ? 'Placing Order…' : 'Place Order'}
            </button>
            <p className="text-ink/40 text-[11px] text-center mt-2 font-body">
              {sellerCount > 1 ? `This will be split into ${sellerCount} separate orders.` : 'You\'ll receive order updates in your dashboard.'}
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}