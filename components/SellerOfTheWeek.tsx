import Link from 'next/link';
import Image from 'next/image';
import FollowButton from './FollowButton';
import { ArrowRightIcon, AwardIcon, CheckBadgeIcon, MapPinIcon, StarIcon, StoreIcon } from './ui/NorzaIcons';

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
    <section className="nm-container nm-section">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="nm-kicker flex items-center gap-2 !text-tomato"><AwardIcon size={16} /> Community spotlight</p>
          <h2 className="nm-section-title mt-1">Seller of the week</h2>
        </div>
        <span className="hidden rounded-md bg-tomato-wash px-3 py-2 text-[10px] font-black uppercase tracking-wide text-tomato sm:block">Local favorite</span>
      </div>
      <div className="relative overflow-hidden rounded-[1rem] bg-mint-wash">
        {seller.storeBanner && (
          <div className="relative h-28 w-full overflow-hidden">
            <Image src={seller.storeBanner} alt="" fill sizes="100vw" unoptimized className="object-cover" />
          </div>
        )}
        <div className="flex flex-col items-start gap-5 p-5 sm:flex-row sm:items-center sm:p-6 md:p-7">
          <div className={`relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border-4 border-white bg-white text-basil ${seller.storeBanner ? '-mt-12' : ''}`}>
            {seller.storeLogo ? (
              <Image src={seller.storeLogo} alt={seller.storeName} fill sizes="80px" unoptimized className="object-cover" />
            ) : (
              <StoreIcon size={30} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/seller/${seller.id}`} className="inline-flex min-h-11 items-center font-body text-xl font-black tracking-tight text-ink transition-colors hover:text-basil">
                {seller.storeName}
              </Link>
              <span title="Verified seller" className="text-basil"><CheckBadgeIcon size={18} /><span className="sr-only">Verified seller</span></span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-stone"><MapPinIcon size={13} /> {seller.barangay} · {seller.productCount} products</p>
            {seller.storeDescription && (
              <p className="text-ink/70 text-sm font-body mt-2 max-w-xl line-clamp-2">{seller.storeDescription}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs">
              {seller.rating !== null && (
                <span className="flex items-center gap-1 font-semibold text-[#8a5a0d]"><StarIcon size={13} filled /> {seller.rating.toFixed(1)} ({seller.reviewCount})</span>
              )}
              <span className="text-ink/50">{seller.followerCount} follower{seller.followerCount === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <FollowButton sellerId={seller.id} initialFollowerCount={seller.followerCount} showCount={false} />
            <Link href={`/seller/${seller.id}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 text-xs font-bold text-basil transition-colors hover:bg-mint-wash">
              Visit store <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
