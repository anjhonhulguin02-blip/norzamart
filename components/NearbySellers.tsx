import Link from 'next/link';
import FollowButton from './FollowButton';
import { CheckBadgeIcon, MapPinIcon, StoreIcon } from './ui/NorzaIcons';

interface NearbySeller {
  id: string;
  storeName: string;
  storeLogo?: string;
  status: string;
  productCount: number;
  followerCount: number;
}

export default function NearbySellers({ barangay, sellers }: { barangay: string; sellers: NearbySeller[] }) {
  if (sellers.length === 0) return null;

  return (
    <section className="nm-container nm-section">
      <p className="nm-kicker flex items-center gap-2"><MapPinIcon size={16} /> Close to home</p>
      <h2 className="nm-section-title mt-2">Nearby sellers</h2>
      <p className="nm-section-copy mt-2">Stores based right here in {barangay}.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sellers.map((s) => (
          <article key={s.id} className="nm-surface group relative p-5 text-center transition-[border-color,box-shadow] hover:border-basil/30 hover:shadow-float">
            <Link href={`/seller/${s.id}`} aria-label={`View ${s.storeName}`} className="absolute inset-0 z-0 rounded-card" />
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1rem] bg-mint-wash text-basil">
              {s.storeLogo ? (
                <img src={s.storeLogo} alt={s.storeName} className="w-full h-full object-cover" />
              ) : (
                <StoreIcon size={26} />
              )}
            </div>
            <div className="flex items-center justify-center gap-1">
              <p className="font-bold text-sm text-ink truncate">{s.storeName}</p>
              {s.status === 'approved' && (
                <span title="Verified seller" className="text-basil"><CheckBadgeIcon size={16} /><span className="sr-only">Verified seller</span></span>
              )}
            </div>
            <p className="mt-1 text-xs text-stone">{s.productCount} products</p>
            <div className="relative z-10 mt-3 flex justify-center">
              <FollowButton sellerId={s.id} initialFollowerCount={s.followerCount} size="sm" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
