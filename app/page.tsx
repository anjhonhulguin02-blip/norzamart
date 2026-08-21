import React from 'react';
import Navbar from '../components/Navbar';
import AnnouncementBanner from '../components/AnnouncementBanner';
import HeroBanner from '../components/HeroBanner';
import ProductGrid from '../components/ProductGrid';
import TodaysDeals from '../components/TodaysDeals';
import FeaturedSellers from '../components/FeaturedSellers';
import FreshToday from '../components/FreshToday';
import WhyChooseUs from '../components/WhyChooseUs';
import TestimonialsSection from '../components/TestimonialsSection';
import Newsletter from '../components/Newsletter';
import SiteFooter from '../components/SiteFooter';
import ProductsNearYou from '../components/ProductsNearYou';
import NearbySellers from '../components/NearbySellers';
import TrendingInBarangay from '../components/TrendingInBarangay';
import SellerOfTheWeek from '../components/SellerOfTheWeek';
import CommunityRecommendations from '../components/CommunityRecommendations';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/lib/models/product';
import Seller from '@/lib/models/seller';
import Review from '@/lib/models/review';
import Category from '@/lib/models/category';
import Follow from '@/lib/models/follow';
import Order from '@/lib/models/order';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from '@/lib/models/user';
import { MapPinIcon } from '@/components/ui/NorzaIcons';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  await connectToDatabase();

  const session = await getServerSession(authOptions);
  let buyerBarangay = '';
  if (session?.user) {
    const buyerDoc = await User.findById((session.user as any).id).select('settings');
    buyerBarangay = buyerDoc?.settings?.barangay || '';
  }

  const allProducts = await Product.find({ status: 'active', approvalStatus: 'approved' }).select('category').lean() as any[];
  const categoryCounts: Record<string, number> = {};
  allProducts.forEach((p: any) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const heroProductsRaw = await Product.find({
    status: 'active',
    approvalStatus: 'approved',
    image: { $exists: true, $ne: '' },
  })
    .select('name image category')
    .sort({ createdAt: -1 })
    .limit(24)
    .lean() as any[];

  const heroProducts = heroProductsRaw
    .map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      image: p.image,
      category: p.category,
    }));

  const categoryDocs = await Category.find().lean() as any[];
  const categoryIcons: Record<string, string> = {};
  categoryDocs.forEach((c: any) => { categoryIcons[c.name] = c.icon; });

  const dbCategories = Object.keys(categoryCounts).map((cat) => ({
    id: cat,
    name: cat,
    icon: categoryIcons[cat] || '🛒',
    count: categoryCounts[cat],
  }));

  const filter: any = { status: 'active', approvalStatus: 'approved' };
  if (category) filter.category = category;

  let rawProducts = await Product.find(filter)
    .populate('seller', 'storeName barangay status deliveryBarangays')
    .sort({ createdAt: -1 })
    .lean() as any[];

  // If the buyer has a saved barangay, only show products from sellers who deliver there
  // (an empty deliveryBarangays list means "delivers everywhere")
  if (buyerBarangay) {
    rawProducts = rawProducts.filter((p: any) => {
      const coverage = (p.availableBarangays?.length ? p.availableBarangays : p.seller?.deliveryBarangays) || [];
      return coverage.length === 0 || coverage.includes(buyerBarangay);
    });
  }

  // Aggregate ratings for all active products in one query
  const productIds = rawProducts.map((p: any) => p._id);
  const ratingAgg = await Review.aggregate([
    { $match: { product: { $in: productIds } } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const ratingMap: Record<string, { avg: number; count: number }> = {};
  ratingAgg.forEach((r: any) => {
    ratingMap[r._id.toString()] = { avg: r.avg, count: r.count };
  });

  const dbProducts = rawProducts.map((p: any) => ({
    id: p._id.toString(),
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image || '🛒',
    tag: p.tag,
    category: p.category,
    brgy: p.seller?.barangay || '',
    unit: p.unit || 'piece',
    rating: ratingMap[p._id.toString()]?.avg ?? null,
    reviewCount: ratingMap[p._id.toString()]?.count ?? 0,
    sellerVerified: p.seller?.status === 'approved',
  }));

  // Today's Deals — active products with a discount, from the full (unfiltered) set
  const dealsRaw = await Product.find({ status: 'active', approvalStatus: 'approved', originalPrice: { $exists: true, $ne: null } })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean() as any[];
  const deals = dealsRaw
    .filter((p: any) => p.originalPrice > p.price)
    .map((p: any) => ({
      id: p._id.toString(), name: p.name, price: p.price, originalPrice: p.originalPrice,
      image: p.image, unit: p.unit || 'piece', stock: p.stock, soldCount: p.soldCount || 0,
      promotionEndsAt: p.promotionEndsAt ? p.promotionEndsAt.toISOString() : undefined,
    }));

  // Fresh Today — products created within the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const freshRaw = await Product.find({ status: 'active', approvalStatus: 'approved', createdAt: { $gte: yesterday } })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean() as any[];
  const freshProducts = freshRaw.map((p: any) => ({
    id: p._id.toString(), name: p.name, price: p.price, unit: p.unit || 'piece',
    image: p.image, category: p.category,
  }));

  const sellerFollowerAgg = await Follow.aggregate([
    { $group: { _id: '$seller', count: { $sum: 1 } } },
  ]);
  const sellerFollowerMap: Record<string, number> = {};
  sellerFollowerAgg.forEach((f: any) => { sellerFollowerMap[f._id.toString()] = f.count; });

  // Hyperlocal: Products Near You, Nearby Sellers, Trending in Your Barangay
  // — only computed when the buyer has a saved barangay to anchor "near you" to.
  let nearbyProducts: any[] = [];
  let nearbySellers: any[] = [];
  let trendingProducts: any[] = [];
  if (buyerBarangay) {
    const nearbyRaw = await Product.find({ status: 'active', approvalStatus: 'approved' })
      .populate('seller', 'storeName barangay status')
      .sort({ createdAt: -1 })
      .lean() as any[];
    const sameBarangay = nearbyRaw.filter((p: any) => p.seller?.barangay === buyerBarangay);

    nearbyProducts = sameBarangay.slice(0, 10).map((p: any) => ({
      id: p._id.toString(), name: p.name, price: p.price, originalPrice: p.originalPrice,
      image: p.image || '🛒', unit: p.unit || 'piece', brgy: p.seller?.barangay || '',
      sellerVerified: p.seller?.status === 'approved',
    }));

    const nearbySellerIds = Array.from(new Set(sameBarangay.map((p: any) => p.seller?._id?.toString()).filter(Boolean)));
    nearbySellers = nearbySellerIds.slice(0, 8).map((id) => {
      const s = sameBarangay.find((p: any) => p.seller?._id?.toString() === id)!.seller;
      return {
        id,
        storeName: s.storeName,
        storeLogo: s.storeLogo,
        status: s.status,
        productCount: sameBarangay.filter((p: any) => p.seller?._id?.toString() === id).length,
        followerCount: sellerFollowerMap[id] || 0,
      };
    });

    const trendingAgg = await Order.aggregate([
      { $match: { deliveryBarangay: buyerBarangay, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalQty: { $sum: '$items.quantity' } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 },
    ]);
    const trendingIds = trendingAgg.map((t: any) => t._id);
    const trendingProductDocs = await Product.find({
      _id: { $in: trendingIds }, status: 'active', approvalStatus: 'approved',
    }).populate('seller', 'barangay status').lean() as any[];
    const trendingDocMap: Record<string, any> = {};
    trendingProductDocs.forEach((p: any) => { trendingDocMap[p._id.toString()] = p; });
    trendingProducts = trendingAgg
      .map((t: any) => trendingDocMap[t._id.toString()])
      .filter(Boolean)
      .map((p: any) => ({
        id: p._id.toString(), name: p.name, price: p.price, originalPrice: p.originalPrice,
        image: p.image || '🛒', unit: p.unit || 'piece', brgy: p.seller?.barangay || '',
        sellerVerified: p.seller?.status === 'approved',
      }));
  }

  // Featured Sellers — top sellers by product count
  const sellersRaw = await Seller.find({}).lean() as any[];
  const sellerProductCounts = await Product.aggregate([
    { $match: { status: 'active', approvalStatus: 'approved' } },
    { $group: { _id: '$seller', count: { $sum: 1 } } },
  ]);
  const sellerCountMap: Record<string, number> = {};
  sellerProductCounts.forEach((s: any) => { sellerCountMap[s._id.toString()] = s.count; });

  const sellerReviewAgg = await Review.aggregate([
    { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'prod' } },
    { $unwind: '$prod' },
    { $group: { _id: '$prod.seller', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const sellerRatingMap: Record<string, { avg: number; count: number }> = {};
  sellerReviewAgg.forEach((r: any) => { sellerRatingMap[r._id.toString()] = { avg: r.avg, count: r.count }; });

  const featuredSellers = sellersRaw
    .map((s: any) => ({
      id: s._id.toString(),
      storeName: s.storeName,
      storeLogo: s.storeLogo,
      barangay: s.barangay,
      status: s.status,
      productCount: sellerCountMap[s._id.toString()] || 0,
      rating: sellerRatingMap[s._id.toString()]?.avg ?? null,
      reviewCount: sellerRatingMap[s._id.toString()]?.count ?? 0,
      followerCount: sellerFollowerMap[s._id.toString()] || 0,
    }))
    .filter((s) => s.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 4);

  // Seller of the Week — highest delivered-order revenue among approved sellers in the
  // last 7 days, falling back to the top-by-product-count seller if no orders yet.
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sellerRevenueAgg = await Order.aggregate([
    { $match: { status: 'delivered', createdAt: { $gte: weekAgo } } },
    { $group: { _id: '$seller', revenue: { $sum: '$total' } } },
    { $sort: { revenue: -1 } },
  ]);
  const approvedSellerIds = new Set(sellersRaw.filter((s: any) => s.status === 'approved').map((s: any) => s._id.toString()));
  const topRevenueEntry = sellerRevenueAgg.find((r: any) => approvedSellerIds.has(r._id?.toString()));
  const sellerOfWeekId = topRevenueEntry?._id?.toString()
    || featuredSellers.find((s) => approvedSellerIds.has(s.id))?.id;
  const sellerOfWeekDoc = sellerOfWeekId ? sellersRaw.find((s: any) => s._id.toString() === sellerOfWeekId) : null;
  const sellerOfWeek = sellerOfWeekDoc ? {
    id: sellerOfWeekDoc._id.toString(),
    storeName: sellerOfWeekDoc.storeName,
    storeLogo: sellerOfWeekDoc.storeLogo,
    storeBanner: sellerOfWeekDoc.storeBanner,
    barangay: sellerOfWeekDoc.barangay,
    storeDescription: sellerOfWeekDoc.storeDescription,
    productCount: sellerCountMap[sellerOfWeekId!] || 0,
    rating: sellerRatingMap[sellerOfWeekId!]?.avg ?? null,
    reviewCount: sellerRatingMap[sellerOfWeekId!]?.count ?? 0,
    followerCount: sellerFollowerMap[sellerOfWeekId!] || 0,
  } : null;

  // Community Recommendations — highest-rated products platform-wide (at least one review)
  const allRatingAgg = await Review.aggregate([
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    { $match: { avg: { $gte: 4 } } },
    { $sort: { avg: -1, count: -1 } },
    { $limit: 10 },
  ]);
  const recommendedIds = allRatingAgg.map((r: any) => r._id);
  const recommendedDocs = await Product.find({
    _id: { $in: recommendedIds }, status: 'active', approvalStatus: 'approved',
  }).populate('seller', 'barangay status').lean() as any[];
  const recommendedDocMap: Record<string, any> = {};
  recommendedDocs.forEach((p: any) => { recommendedDocMap[p._id.toString()] = p; });
  const recommendedRatingMap: Record<string, { avg: number; count: number }> = {};
  allRatingAgg.forEach((r: any) => { recommendedRatingMap[r._id.toString()] = { avg: r.avg, count: r.count }; });
  const communityRecommendations = allRatingAgg
    .map((r: any) => recommendedDocMap[r._id.toString()])
    .filter(Boolean)
    .map((p: any) => ({
      id: p._id.toString(), name: p.name, price: p.price, originalPrice: p.originalPrice,
      image: p.image || '🛒', unit: p.unit || 'piece', brgy: p.seller?.barangay || '',
      sellerVerified: p.seller?.status === 'approved',
      rating: recommendedRatingMap[p._id.toString()]?.avg ?? null,
      reviewCount: recommendedRatingMap[p._id.toString()]?.count ?? 0,
    }));

  // Testimonials — most recent reviews that have a written comment
  const testimonialsRaw = await Review.find({ comment: { $exists: true, $ne: '' } })
    .populate('product', 'name')
    .sort({ createdAt: -1 })
    .limit(6)
    .lean() as any[];
  const testimonials = testimonialsRaw.map((r: any) => ({
    userName: r.userName,
    rating: r.rating,
    comment: r.comment,
    productName: r.product?.name || 'a product',
    createdAt: r.createdAt,
  }));

  return (
    <main className="nm-home flex min-h-screen w-full flex-col justify-between antialiased">
      <div>
        <AnnouncementBanner variant="utility" />
        <Navbar />
        <HeroBanner products={heroProducts} />
        {buyerBarangay && (
          <div className="nm-container mt-6">
            <div className="flex min-h-11 items-center gap-2 rounded-control border border-basil/20 bg-mint-wash px-4 py-2.5 text-xs font-semibold text-basil sm:text-sm">
              <MapPinIcon size={17} />
              Showing products available in <strong>{buyerBarangay}</strong>
            </div>
          </div>
        )}
        {buyerBarangay && <NearbySellers barangay={buyerBarangay} sellers={nearbySellers} />}
        {buyerBarangay && <ProductsNearYou barangay={buyerBarangay} products={nearbyProducts} />}
        <ProductGrid categories={dbCategories} products={dbProducts} activeCategory={category} />
        <TodaysDeals deals={deals} />
        {buyerBarangay && <TrendingInBarangay barangay={buyerBarangay} products={trendingProducts} />}
        <FreshToday products={freshProducts} />
        <WhyChooseUs />
        <CommunityRecommendations products={communityRecommendations} />
        <FeaturedSellers sellers={featuredSellers} />
        <SellerOfTheWeek seller={sellerOfWeek} />
        <TestimonialsSection reviews={testimonials} />
        <Newsletter />
      </div>

      <SiteFooter />
    </main>
  );
}
