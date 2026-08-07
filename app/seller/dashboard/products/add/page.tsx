"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fileToBase64, uploadIfNew } from '@/lib/uploadImage';

const units = [
  { value: 'piece', label: 'Per Piece' },
  { value: 'kilo', label: 'Per Kilo' },
  { value: 'gram', label: 'Per Gram' },
  { value: 'pack', label: 'Per Pack' },
  { value: 'bundle', label: 'Per Bundle' },
  { value: 'liter', label: 'Per Liter' },
  { value: 'dozen', label: 'Per Dozen' },
];

export default function AddProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '', description: '', category: '', price: '', originalPrice: '',
    stock: '', tag: '', unit: 'piece', weight: '', origin: '', freshUntil: '', deliveryFee: '',
  });
  const [image, setImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string; icon: string }[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [availableBarangays, setAvailableBarangays] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
    fetch('/api/barangays')
      .then((res) => res.json())
      .then((data) => setBarangays((data.barangays || []).map((b: any) => b.name)));
  }, []);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const encoded = await Promise.all(files.map(fileToBase64));
    setGallery((prev) => [...prev, ...encoded].slice(0, 6));
  };

  const removeGalleryImage = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const [uploadedImage, uploadedGallery] = await Promise.all([
        uploadIfNew(image, 'products'),
        Promise.all(gallery.map((g) => uploadIfNew(g, 'products'))),
      ]);

      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
          stock: Number(form.stock),
          deliveryFee: form.deliveryFee ? Number(form.deliveryFee) : undefined,
          image: uploadedImage,
          images: uploadedGallery,
          availableBarangays,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
        setIsSubmitting(false);
        return;
      }

      router.push('/seller/dashboard/products');
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to the server.');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">Add Product</h1>
      <p className="text-ink/60 text-sm font-body mt-1">Fill in the details of your new product.</p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-8 shadow-lg mt-6 max-w-3xl"
      >
        {error && (
          <div className="bg-tomato/10 border border-tomato/20 text-tomato text-xs font-semibold rounded-xl p-3 mb-5 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-ink/70 mb-1">Product Name *</label>
            <input required value={form.name} onChange={(e) => update('name', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-ink/70 mb-1">Main Photo</label>
            {image && (
              <div className="w-28 h-28 bg-white border border-ink/10 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <input type="file" accept="image/*"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImage(await fileToBase64(f)); }}
              className="w-full text-xs text-ink/70" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-ink/70 mb-1">Additional Photos (up to 6)</label>
            {gallery.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {gallery.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 bg-white border border-ink/10 rounded-lg overflow-hidden">
                    <img src={img} alt={`Extra ${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      className="absolute top-0 right-0 bg-tomato text-white w-4 h-4 text-[10px] flex items-center justify-center rounded-bl-md"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" accept="image/*" multiple
              onChange={handleGalleryUpload}
              className="w-full text-xs text-ink/70" />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Category *</label>
            <select required value={form.category} onChange={(e) => update('category', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Sold By *</label>
            <select required value={form.unit} onChange={(e) => update('unit', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40">
              {units.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Tag (optional)</label>
            <input placeholder="e.g. New, Sale, Best Seller" value={form.tag} onChange={(e) => update('tag', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Price (₱) *</label>
            <input type="number" min="0" step="0.01" required value={form.price} onChange={(e) => update('price', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Original Price (optional)</label>
            <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => update('originalPrice', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Stock Quantity *</label>
            <input type="number" min="0" required value={form.stock} onChange={(e) => update('stock', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-ink/70 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Weight (optional)</label>
            <input placeholder="e.g. 500g, 1kg" value={form.weight} onChange={(e) => update('weight', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Origin (optional)</label>
            <input placeholder="e.g. Norzagaray, Bulacan" value={form.origin} onChange={(e) => update('origin', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Fresh Until (optional)</label>
            <input type="date" value={form.freshUntil} onChange={(e) => update('freshUntil', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink/70 mb-1">Delivery Fee Override (₱, optional)</label>
            <input type="number" min="0" step="0.01" placeholder="Leave blank to use default" value={form.deliveryFee} onChange={(e) => update('deliveryFee', e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-ink/70 mb-2">Available Barangays (optional)</label>
            <p className="text-ink/50 text-[11px] mb-2">Leave empty to use your store's default delivery coverage.</p>
            <div className="flex flex-wrap gap-2">
              {barangays.map((b) => {
                const isSelected = availableBarangays.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setAvailableBarangays((prev) =>
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

          <button type="submit" disabled={isSubmitting}
            className="md:col-span-2 bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold py-3.5 rounded-xl shadow-md shadow-basil/20 mt-2 text-sm transition-all">
            {isSubmitting ? 'Saving…' : 'Save Product →'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}