import connectToDatabase from '@/lib/mongodb';
import Seller from '@/lib/models/seller';
import Product from '@/lib/models/product';
import Review from '@/lib/models/review';
import Follow from '@/lib/models/follow';
import Navbar from '@/components/Navbar';
import FollowButton from '@/components/FollowButton';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { formatPeso, formatUnitSuffix } from '@/lib/formatProduct';
import { BASE_URL } from '@/lib/siteUrl';
import { safeJsonLdStringify } from '@/lib/safeJsonLd';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  await connectToDatabase();
  const seller = await Seller.findById(id).select('storeName storeDescription storeLogo barangay status').lean() as any;

  if (!seller || seller.status !== 'approved') {
    return { title: 'Store Not Found' };
  }

  const title = seller.storeName;
  const description = seller.storeDescription
    ? seller.storeDescription.slice(0, 155)
    : `Shop fresh groceries from ${seller.storeName}, a local seller in ${seller.barangay}, Norzagaray, on NorzaMart.`;

  // Some store logos are stored as base64 data URIs rather than hosted URLs;
  // og:image/twitter:image require a fetchable http(s) URL, so skip those and
  // let the root opengraph-image fallback take over instead.
  const hasLinkableImage = typeof seller.storeLogo === 'string' && /^https?:\/\//.test(seller.storeLogo);

  return {
    title,
    description,
    alternates: {
      canonical: `/seller/${id}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [hasLinkableImage ? { url: seller.storeLogo } : { url: '/opengraph-image' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [hasLinkableImage ? seller.storeLogo : '/opengraph-image'],
    },
  };
}

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();

  const seller = await Seller.findById(id).select('-governmentId').lean() as any;
  if (!seller || seller.status !== 'approved') {
    notFound();
  }

  const followerCount = await Follow.countDocuments({ seller: id });

  const products = await Product.find({ seller: id, status: 'active', approvalStatus: 'approved' }).sort({ createdAt: -1 }).lean() as any[];
  const productIds = products.map((p: any) => p._id);
  const reviews = await Review.find({ product: { $in: productIds } }).lean() as any[];

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const ratingByProduct: Record<string, { total: number; count: number }> = {};
  reviews.forEach((r) => {
    const pid = r.product.toString();
    if (!ratingByProduct[pid]) ratingByProduct[pid] = { total: 0, count: 0 };
    ratingByProduct[pid].total += r.rating;
    ratingByProduct[pid].count += 1;
  });

  const newArrivals = products.slice(0, 4);

  const topRated = products
    .filter((p: any) => ratingByProduct[p._id.toString()])
    .sort((a: any, b: any) => {
      const avgA = ratingByProduct[a._id.toString()].total / ratingByProduct[a._id.toString()].count;
      const avgB = ratingByProduct[b._id.toString()].total / ratingByProduct[b._id.toString()].count;
      return avgB - avgA;
    })
    .slice(0, 4);

  const ProductCard = ({ p }: { p: any }) => (
    <Link
      href={`/product/${p._id}`}
      className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
    >
      <div className="relative w-full h-32 bg-white rounded-xl flex items-center justify-center overflow-hidden mb-3">
        {p.image ? (
          p.image.startsWith('http') ? (
            <Image src={p.image} alt={p.name} fill sizes="(max-width: 639px) 92vw, (max-width: 767px) 45vw, (max-width: 1023px) 30vw, 260px" className="object-contain" />
          ) : (
            <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
          )
        ) : (
          <span className="text-4xl">🛒</span>
        )}
      </div>
      <h3 className="font-body font-bold text-sm text-ink line-clamp-1">{p.name}</h3>
      <p className="font-mono text-sm font-bold text-ink mt-1">{formatPeso(p.price)} <span className="text-ink/40 text-xs">{formatUnitSuffix(p.unit)}</span></p>
    </Link>
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: seller.storeName, item: `${BASE_URL}/seller/${id}` },
    ],
  };

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbJsonLd) }} />
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">

        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-3xl p-8 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative w-20 h-20 rounded-2xl bg-basil/10 flex items-center justify-center overflow-hidden shrink-0">
            {seller.storeLogo ? (
              seller.storeLogo.startsWith('http') ? (
                <Image src={seller.storeLogo} alt={seller.storeName} fill sizes="80px" className="object-cover" />
              ) : (
                <img src={seller.storeLogo} alt={seller.storeName} className="w-full h-full object-cover" />
              )
            ) : (
              <span className="text-3xl">🏬</span>
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-basil">{seller.storeName}</h1>
            <p className="text-ink/60 text-sm font-body mt-1">📍 {seller.barangay}</p>
            {seller.storeDescription && (
              <p className="text-ink/70 text-sm font-body mt-2 max-w-xl">{seller.storeDescription}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs font-body">
              <span className="text-ink/60">{products.length} products</span>
              {average && (
                <span className="text-yellow-600 font-semibold">★ {average} ({reviews.length} reviews)</span>
              )}
            </div>
            <div className="mt-4">
              <FollowButton sellerId={id} initialFollowerCount={followerCount} />
            </div>
          </div>
        </div>

        {topRated.length > 0 && (
          <>
            <h2 className="font-display text-xl font-semibold text-ink mt-10 mb-4">⭐ Top Rated</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {topRated.map((p: any) => <ProductCard key={p._id.toString()} p={p} />)}
            </div>
          </>
        )}

        {newArrivals.length > 0 && (
          <>
            <h2 className="font-display text-xl font-semibold text-ink mt-10 mb-4">🌱 New Arrivals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {newArrivals.map((p: any) => <ProductCard key={p._id.toString()} p={p} />)}
            </div>
          </>
        )}

        <h2 className="font-display text-xl font-semibold text-ink mt-10 mb-4">All Products from {seller.storeName}</h2>

        {products.length === 0 ? (
          <p className="text-ink/50 text-sm font-body">No products listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p: any) => <ProductCard key={p._id.toString()} p={p} />)}
          </div>
        )}
      </div>
    </main>
  );
}