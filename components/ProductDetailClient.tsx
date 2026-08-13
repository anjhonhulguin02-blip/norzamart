"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fileToBase64, uploadIfNew } from '@/lib/uploadImage';
import { formatPeso, formatUnitSuffix } from '@/lib/formatProduct';
import { useAuthPrompt } from './AuthPromptProvider';
import { useToast } from './ui/Toast';

interface Review {
  _id: string;
  userName: string;
  rating: number;
  comment?: string;
  images?: string[];
  likeCount?: number;
  likedByMe?: boolean;
  verifiedPurchase?: boolean;
  createdAt: string;
}

interface Props {
  productId: string;
  sellerId: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  unit: string;
  images: string[];
  category: string;
  sellerName: string;
  sellerBarangay: string;
  deliveryBarangays: string[];
  deliveryFee?: number;
  buyerBarangay?: string;
  description?: string;
  tag?: string;
  createdAt: string;
  weight?: string;
  origin?: string;
  freshUntil?: string;
  soldCount?: number;
  estimatedDeliveryTime?: string;
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ProductDetailClient({
  productId, sellerId, name, price, originalPrice, stock, unit, images, category,
  sellerName, sellerBarangay, deliveryBarangays, deliveryFee, buyerBarangay, description, tag, createdAt,
  weight, origin, freshUntil, soldCount, estimatedDeliveryTime,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { requireAuth } = useAuthPrompt();
  const { showToast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [myReviewImages, setMyReviewImages] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [startingChat, setStartingChat] = useState(false);

  const dec = () => setQuantity((q) => Math.max(1, q - 1));
  const inc = () => setQuantity((q) => Math.min(stock, q + 1));

  const fetchReviews = async () => {
    setLoadingReviews(true);
    const res = await fetch(`/api/products/${productId}/reviews`);
    const data = await res.json();
    setReviews(data.reviews || []);
    setAverage(data.average || 0);
    setReviewCount(data.count || 0);
    setLoadingReviews(false);
  };

  useEffect(() => { fetchReviews(); }, [productId]);

  useEffect(() => {
    if (session) {
      fetch('/api/wishlist/ids')
        .then((res) => res.json())
        .then((data) => setIsWishlisted((data.ids || []).includes(productId)))
        .catch(() => {});
    }
  }, [session, productId]);

  // Track recently viewed products locally
  useEffect(() => {
    try {
      const key = 'recently_viewed';
      const existing = JSON.parse(localStorage.getItem(key) || '[]') as string[];
      const updated = [productId, ...existing.filter((id) => id !== productId)].slice(0, 20);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, [productId]);

  const doToggleWishlist = async () => {
    setWishlistLoading(true);
    const prev = isWishlisted;
    setIsWishlisted(!prev);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        setIsWishlisted(prev);
        showToast('Could not update your wishlist.', 'error');
      }
    } catch {
      setIsWishlisted(prev);
      showToast('Unable to connect to the server.', 'error');
    }
    setWishlistLoading(false);
  };

  const toggleWishlist = () => {
    if (!session) {
      requireAuth(doToggleWishlist, 'Sign in to save items to your wishlist.');
      return;
    }
    doToggleWishlist();
  };

  const doAddToCart = async () => {
    setAddingToCart(true);
    setCartMessage('');
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        setCartMessage('Added to basket!');
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        setCartMessage(data.message || 'Something went wrong.');
      }
    } catch {
      setCartMessage('Unable to connect to the server.');
    }
    setAddingToCart(false);
  };

  const handleAddToCart = () => {
    if (!session) {
      requireAuth(doAddToCart, `Sign in to add "${name}" to your basket.`);
      return;
    }
    doAddToCart();
  };

  const doBuyNow = () => {
    router.push(`/checkout?buyNow=1&productId=${productId}&quantity=${quantity}`);
  };

  const handleBuyNow = () => {
    if (!session) {
      requireAuth(doBuyNow, `Sign in to buy "${name}" now.`);
      return;
    }
    doBuyNow();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (myRating === 0) {
      setReviewError('Please select a rating.');
      return;
    }
    setSubmittingReview(true);
    try {
      const uploadedImages = await Promise.all(myReviewImages.map((img) => uploadIfNew(img, 'reviews')));
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: myRating, comment: myComment, images: uploadedImages }),
      });
      const data = await res.json();
      if (res.ok) {
        setMyRating(0);
        setMyComment('');
        setMyReviewImages([]);
        fetchReviews();
      } else {
        setReviewError(data.message || 'Something went wrong.');
      }
    } catch {
      setReviewError('Unable to connect to the server.');
    }
    setSubmittingReview(false);
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const encoded = await Promise.all(files.map(fileToBase64));
    setMyReviewImages((prev) => [...prev, ...encoded].slice(0, 4));
  };

  const removeReviewImage = (index: number) => {
    setMyReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const doToggleLike = async (reviewId: string) => {
    setReviews((prev) => prev.map((r) => r._id === reviewId
      ? { ...r, likedByMe: !r.likedByMe, likeCount: (r.likeCount || 0) + (r.likedByMe ? -1 : 1) }
      : r));
    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => prev.map((r) => r._id === reviewId ? { ...r, likedByMe: data.liked, likeCount: data.likeCount } : r));
      } else {
        showToast('Could not update your like.', 'error');
      }
    } catch {
      showToast('Unable to connect to the server.', 'error');
    }
  };

  const handleToggleLike = (reviewId: string) => {
    if (!session) {
      requireAuth(() => doToggleLike(reviewId), 'Sign in to like a review.');
      return;
    }
    doToggleLike(reviewId);
  };

  const doStartChat = async () => {
    setStartingChat(true);
    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, productId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/messages/${data.conversationId}`);
      } else {
        showToast(data.message || 'Could not start a conversation.', 'error');
      }
    } catch {
      showToast('Unable to connect to the server.', 'error');
    }
    setStartingChat(false);
  };

  const handleChatClick = () => {
    if (!session) {
      requireAuth(doStartChat, `Sign in to chat with ${sellerName}.`);
      return;
    }
    doStartChat();
  };

  const galleryImages = images.length > 0 ? images : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl shadow-lg overflow-hidden aspect-square flex items-center justify-center relative">
            {tag && (
              <span className="absolute top-4 left-4 bg-tomato text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md z-10">
                {tag}
              </span>
            )}
            <span className="absolute top-4 right-4 bg-basil/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md z-10">
              🌱 {timeAgo(createdAt)}
            </span>
            {galleryImages[selectedImage] ? (
              galleryImages[selectedImage].startsWith('http') ? (
                <Image
                  src={galleryImages[selectedImage]}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  preload={selectedImage === 0}
                />
              ) : (
                <img src={galleryImages[selectedImage]} alt={name} className="max-w-full max-h-full object-contain" />
              )
            ) : (
              <span className="text-7xl">🛒</span>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? 'border-basil' : 'border-white/60 opacity-70 hover:opacity-100'
                  }`}
                >
                  {img.startsWith('http') ? (
                    <Image src={img} alt={`${name} ${i}`} fill sizes="64px" className="object-cover" />
                  ) : (
                    <img src={img} alt={`${name} ${i}`} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <span className="text-[11px] font-bold text-basil bg-basil/10 px-2.5 py-1 rounded-md">
            {category}
          </span>

          <h1 className="font-display text-3xl font-semibold text-ink mt-3">{name}</h1>

          <div className="flex items-center gap-1.5 mt-2 text-sm">
            {reviewCount > 0 ? (
              <>
                <span className="text-yellow-500">{'★'.repeat(Math.round(average))}{'☆'.repeat(5 - Math.round(average))}</span>
                <span className="text-ink/50 text-xs">{average.toFixed(1)} ({reviewCount} review{reviewCount > 1 ? 's' : ''})</span>
              </>
            ) : (
              <span className="text-ink/40 text-xs">No reviews yet</span>
            )}
          </div>

          <div className="flex items-baseline gap-3 mt-4">
            <span className="font-mono text-3xl font-bold text-ink">{formatPeso(price)}</span>
            {originalPrice && (
              <span className="font-mono text-base text-ink/40 line-through">{formatPeso(originalPrice)}</span>
            )}
            <span className="text-ink/40 text-sm">{formatUnitSuffix(unit)}</span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <p className={`text-xs font-semibold ${stock > 0 ? 'text-basil' : 'text-tomato'}`}>
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </p>
            {!!soldCount && (
              <p className="text-ink/40 text-xs">· {soldCount} sold</p>
            )}
          </div>

          <div className="border-t border-ink/10 mt-5 pt-5 flex items-center justify-between">
            <Link href={`/seller/${sellerId}`} className="group">
              <p className="text-xs font-bold text-ink/50 uppercase tracking-wide">Seller</p>
              <p className="text-sm font-semibold text-ink mt-1 group-hover:text-basil transition-colors">{sellerName} →</p>
              <p className="text-xs text-ink/50 mt-0.5">📍 {sellerBarangay}</p>
            </Link>
            <button
              onClick={handleChatClick}
              disabled={startingChat}
              className="text-xs font-bold text-basil bg-basil/10 hover:bg-basil/20 disabled:opacity-50 px-3.5 py-2 rounded-lg transition-all"
            >
              {startingChat ? 'Opening…' : '💬 Chat with Seller'}
            </button>
          </div>

          <div className="border-t border-ink/10 mt-5 pt-5">
            <p className="text-xs font-bold text-ink/50 uppercase tracking-wide mb-2">🚚 Delivery</p>
            {buyerBarangay && (deliveryBarangays.length === 0 || deliveryBarangays.includes(buyerBarangay)) && (
              <p className="text-basil text-xs font-semibold mb-1.5">✔️ Delivers to your barangay ({buyerBarangay})</p>
            )}
            <p className="text-ink/60 text-xs font-body">
              {deliveryBarangays.length === 0
                ? 'This seller delivers to all barangays in Norzagaray.'
                : `Delivers to: ${deliveryBarangays.join(', ')}`}
            </p>
            <p className="text-basil text-xs font-semibold mt-1.5">
              🕐 Estimated Delivery: {estimatedDeliveryTime || '1-3 days'}
            </p>
            <p className="text-ink/40 text-[11px] mt-1">
              {deliveryFee !== undefined && deliveryFee !== null
                ? `Delivery fee for this item: ₱${deliveryFee.toFixed(2)} (waived on orders ₱500 and up, per store).`
                : 'Free delivery on orders ₱500 and up, per store.'}
            </p>
          </div>

          {description && (
            <div className="border-t border-ink/10 mt-5 pt-5">
              <p className="text-xs font-bold text-ink/50 uppercase tracking-wide">Description</p>
              <p className="text-sm text-ink/80 font-body mt-1">{description}</p>
            </div>
          )}

          {(weight || origin || freshUntil) && (
            <div className="border-t border-ink/10 mt-5 pt-5">
              <p className="text-xs font-bold text-ink/50 uppercase tracking-wide mb-2">Specifications</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {weight && (
                  <>
                    <span className="text-ink/50">Weight</span>
                    <span className="text-ink font-semibold">{weight}</span>
                  </>
                )}
                {origin && (
                  <>
                    <span className="text-ink/50">Origin</span>
                    <span className="text-ink font-semibold">{origin}</span>
                  </>
                )}
                {freshUntil && (
                  <>
                    <span className="text-ink/50">Fresh Until</span>
                    <span className="text-ink font-semibold">{new Date(freshUntil).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-ink/10 mt-5 pt-5">
            <p className="text-xs font-bold text-ink/50 uppercase tracking-wide mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <button onClick={dec} disabled={quantity <= 1}
                className="w-9 h-9 rounded-full bg-white border border-ink/10 font-bold text-ink hover:bg-basil/5 disabled:opacity-40 transition-all">
                −
              </button>
              <span className="font-mono font-bold text-lg w-8 text-center">{quantity}</span>
              <button onClick={inc} disabled={quantity >= stock}
                className="w-9 h-9 rounded-full bg-white border border-ink/10 font-bold text-ink hover:bg-basil/5 disabled:opacity-40 transition-all">
                +
              </button>
            </div>
          </div>

          {cartMessage && (
            <p className={`text-xs font-semibold mt-3 ${cartMessage.includes('Added') ? 'text-basil' : 'text-tomato'}`}>
              {cartMessage}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleBuyNow}
              disabled={stock === 0}
              className="flex-1 bg-tomato hover:bg-tomato/90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md shadow-tomato/20 text-sm transition-all">
              Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              disabled={stock === 0 || addingToCart}
              className="flex-1 bg-basil hover:bg-basil-light disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md shadow-basil/20 text-sm transition-all">
              {addingToCart ? 'Adding…' : 'Add to Basket'}
            </button>
            <button
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              aria-label="Wishlist"
              className={`w-14 h-14 rounded-xl border flex items-center justify-center text-lg transition-all ${
                isWishlisted ? 'bg-tomato text-white border-tomato' : 'bg-white border-ink/10 hover:bg-tomato/5 text-tomato'
              }`}>
              {isWishlisted ? '♥' : '♡'}
            </button>
          </div>
          {!session && (
            <p className="text-ink/40 text-[11px] mt-2">Sign in to add items to your basket or wishlist.</p>
          )}
        </motion.div>
      </div>

      <div className="mt-14 border-t border-ink/10 pt-8">
        <h2 className="font-display text-xl font-semibold text-basil mb-5">Reviews</h2>

        {session && (
          <form onSubmit={handleSubmitReview} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-5 mb-6 max-w-lg">
            <p className="text-xs font-bold text-ink/70 mb-2">Leave a review</p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setMyRating(star)}
                  className={`text-2xl transition-colors ${star <= myRating ? 'text-yellow-500' : 'text-ink/20'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              placeholder="Share your experience (optional)"
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              className="w-full bg-white border border-ink/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-basil/40"
            />

            {myReviewImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {myReviewImages.map((img, i) => (
                  <div key={i} className="relative w-14 h-14 bg-white border border-ink/10 rounded-lg overflow-hidden">
                    <img src={img} alt={`Review photo ${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeReviewImage(i)}
                      className="absolute top-0 right-0 bg-tomato text-white w-4 h-4 text-[10px] flex items-center justify-center rounded-bl-md"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2">
              <label className="text-xs font-bold text-ink/60 cursor-pointer">
                📷 Add photos (optional)
                <input type="file" accept="image/*" multiple onChange={handleReviewImageUpload} className="hidden" />
              </label>
            </div>

            {reviewError && <p className="text-tomato text-xs font-semibold mt-2">{reviewError}</p>}
            <button
              type="submit"
              disabled={submittingReview}
              className="mt-3 bg-basil hover:bg-basil-light disabled:opacity-60 text-white font-bold text-xs px-5 py-2 rounded-lg transition-all"
            >
              {submittingReview ? 'Posting…' : 'Post Review'}
            </button>
          </form>
        )}

        {loadingReviews ? (
          <p className="text-ink/50 text-sm font-body">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-ink/50 text-sm font-body">No reviews yet. Be the first to share your experience!</p>
        ) : (
          <div className="flex flex-col gap-4 max-w-2xl">
            {reviews.map((r) => (
              <div key={r._id} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">{r.userName}</span>
                    {r.verifiedPurchase && (
                      <span className="text-basil text-[10px] font-bold bg-basil/10 px-1.5 py-0.5 rounded-full">✔️ Verified Purchase</span>
                    )}
                  </div>
                  <span className="text-yellow-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className="text-ink/70 text-sm font-body mt-1.5">{r.comment}</p>}

                {r.images && r.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {r.images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-ink/10 shrink-0">
                        <img src={img} alt={`Review photo ${i}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2.5">
                  <p className="text-ink/40 text-[11px]">{timeAgo(r.createdAt)}</p>
                  <button
                    onClick={() => handleToggleLike(r._id)}
                    className={`flex items-center gap-1 text-xs font-bold transition-colors ${r.likedByMe ? 'text-basil' : 'text-ink/40 hover:text-basil'}`}
                  >
                    {r.likedByMe ? '👍' : '👍🏻'} {r.likeCount || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}