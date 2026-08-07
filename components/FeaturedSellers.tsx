import Link from 'next/link';
import FollowButton from './FollowButton';

interface SellerCard {
  id: string;
  storeName: string;
  storeLogo?: string;
  barangay: string;
  status: string;
  productCount: number;
  rating: number | null;
  reviewCount: number;
  followerCount: number;
}

export default function FeaturedSellers({ sellers }: { sellers: SellerCard[] }) {
  if (sellers.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm mb-4">🏬 Featured Local Sellers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {sellers.map((s) => (
          <Link
            key={s.id}
            href={`/seller/${s.id}`}
            className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-basil/10 flex items-center justify-center overflow-hidden mb-3">
              {s.storeLogo ? (
                <img src={s.storeLogo} alt={s.storeName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🏬</span>
              )}
            </div>
            <div className="flex items-center justify-center gap-1">
              <p className="font-bold text-sm text-ink truncate">{s.storeName}</p>
              {s.status === 'approved' && (
                <span title="Verified Seller" className="text-basil text-xs">✔️</span>
              )}
            </div>
            <p className="text-ink/50 text-xs font-body mt-0.5">📍 {s.barangay}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-[11px]">
              <span className="text-ink/60">{s.productCount} products</span>
              {s.rating !== null && (
                <span className="text-yellow-600 font-semibold">★ {s.rating.toFixed(1)}</span>
              )}
            </div>
            <div className="mt-3 flex justify-center">
              <FollowButton sellerId={s.id} initialFollowerCount={s.followerCount} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}