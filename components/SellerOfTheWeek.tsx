import Link from 'next/link';
import FollowButton from './FollowButton';

interface SellerHighlight {
  id: string;
  storeName: string;
  storeLogo?: string;
  storeBanner?: string;
  barangay: string;
  storeDescription?: string;
  productCount: number;
  rating: number | null;
  reviewCount: number;
  followerCount: number;
}

export default function SellerOfTheWeek({ seller }: { seller: SellerHighlight | null }) {
  if (!seller) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm mb-4">🏆 Seller of the Week</h2>
      <div className="relative bg-white/50 backdrop-blur-xl border border-white/70 rounded-3xl shadow-lg overflow-hidden">
        {seller.storeBanner && (
          <div className="h-28 w-full overflow-hidden">
            <img src={seller.storeBanner} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-basil/10 flex items-center justify-center overflow-hidden shrink-0 -mt-12 border-4 border-white shadow-md">
            {seller.storeLogo ? (
              <img src={seller.storeLogo} alt={seller.storeName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">🏬</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/seller/${seller.id}`} className="font-display text-xl font-semibold text-ink hover:text-basil transition-colors">
                {seller.storeName}
              </Link>
              <span title="Verified Seller" className="text-basil text-sm">✔️</span>
            </div>
            <p className="text-ink/50 text-xs font-body mt-0.5">📍 {seller.barangay} · {seller.productCount} products</p>
            {seller.storeDescription && (
              <p className="text-ink/70 text-sm font-body mt-2 max-w-xl line-clamp-2">{seller.storeDescription}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs">
              {seller.rating !== null && (
                <span className="text-yellow-600 font-semibold">★ {seller.rating.toFixed(1)} ({seller.reviewCount})</span>
              )}
              <span className="text-ink/50">{seller.followerCount} follower{seller.followerCount === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <FollowButton sellerId={seller.id} initialFollowerCount={seller.followerCount} showCount={false} />
            <Link href={`/seller/${seller.id}`} className="text-basil text-xs font-bold hover:underline">
              Visit Store →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
