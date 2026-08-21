import Link from 'next/link';
import Image from 'next/image';
import FollowButton from './FollowButton';
import { CheckBadgeIcon, MapPinIcon, StarIcon, StoreIcon } from './ui/NorzaIcons';

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
    <section id="local-stores" className="nm-container nm-section scroll-mt-36">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="nm-kicker inline-flex items-center gap-2"><StoreIcon size={15} /> Shop your neighborhood</p>
          <h2 className="nm-section-title mt-1">Popular local stores</h2>
          <p className="mt-1 text-xs text-stone">Verified sellers serving communities across Norzagaray.</p>
        </div>
        <Link href="/search?type=stores" className="inline-flex min-h-11 items-center rounded-control px-2 text-xs font-black text-basil transition-colors hover:bg-mint-wash">View all stores</Link>
      </div>
      <div className={`mt-5 ${sellers.length < 4 ? 'grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]' : ''}`}>
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${sellers.length >= 4 ? 'lg:grid-cols-4' : ''}`}>
          {sellers.map((s) => (
            <article key={s.id} className="group relative rounded-[0.8rem] bg-[#f4f7f4] p-4 text-center text-ink transition-colors hover:bg-mint-wash">
            <Link href={`/seller/${s.id}`} aria-label={`View ${s.storeName}`} className="absolute inset-0 z-0 rounded-[0.8rem]" />
            <div className="relative mx-auto mb-2.5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[0.75rem] bg-mint-wash text-basil">
              {s.storeLogo ? (
                <Image src={s.storeLogo} alt={s.storeName} fill sizes="56px" unoptimized className="object-cover" />
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
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-stone"><MapPinIcon size={13} /> {s.barangay}</p>
            <div className="mt-2 flex items-center justify-center gap-2 text-[10px]">
              <span className="text-stone">{s.productCount} products</span>
              {s.rating !== null && (
                <span className="flex items-center gap-1 font-semibold text-[#8a5a0d]"><StarIcon size={12} filled /> {s.rating.toFixed(1)}</span>
              )}
            </div>
            <div className="relative z-10 mt-3 flex justify-center">
              <FollowButton sellerId={s.id} initialFollowerCount={s.followerCount} size="sm" />
            </div>
            </article>
          ))}
        </div>
        {sellers.length < 4 && (
          <aside className="relative flex min-h-48 flex-col justify-between overflow-hidden rounded-[0.8rem] bg-mint-wash p-5">
            <span aria-hidden="true" className="absolute -bottom-12 -right-8 h-36 w-36 rounded-full border-[24px] border-basil/8" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-basil">Grow with NorzaMart</p>
              <h3 className="mt-2 font-body text-xl font-black tracking-tight text-ink">Bring your local store online.</h3>
              <p className="mt-2 text-xs leading-5 text-stone">Reach more neighbors with a storefront made for Norzagaray sellers.</p>
            </div>
            <Link href="/seller/register" className="relative mt-5 inline-flex min-h-11 items-center justify-center self-start rounded-full border border-basil bg-white px-5 text-xs font-black text-basil transition-colors hover:bg-basil hover:text-white">Start selling</Link>
          </aside>
        )}
      </div>
    </section>
  );
}
