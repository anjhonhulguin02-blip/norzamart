import React from 'react';
import Navbar from '../components/Navbar';
import AnnouncementBanner from '../components/AnnouncementBanner';
import HeroBanner from '../components/HeroBanner';
import ProductGrid from '../components/ProductGrid';
import StatsSection from '../components/StatsSection';
import TodaysDeals from '../components/TodaysDeals';
import FeaturedSellers from '../components/FeaturedSellers';
import FreshToday from '../components/FreshToday';
import WhyChooseUs from '../components/WhyChooseUs';
import TestimonialsSection from '../components/TestimonialsSection';
import Newsletter from '../components/Newsletter';
import SiteFooter from '../components/SiteFooter';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/lib/models/product';
import Seller from '@/lib/models/seller';
import Review from '@/lib/models/review';
import Category from '@/lib/models/category';
import Follow from '@/lib/models/follow';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from '@/lib/models/user';

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

  const sellerFollowerAgg = await Follow.aggregate([
    { $group: { _id: '$seller', count: { $sum: 1 } } },
  ]);
  const sellerFollowerMap: Record<string, number> = {};
  sellerFollowerAgg.forEach((f: any) => { sellerFollowerMap[f._id.toString()] = f.count; });

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
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex flex-col justify-between antialiased">
      <div>
        <Navbar />
        <AnnouncementBanner />
        <HeroBanner />
        {buyerBarangay && (
          <div className="max-w-7xl mx-auto px-4 mt-6">
            <div className="bg-basil/10 border border-basil/20 rounded-xl px-4 py-2.5 text-xs font-semibold text-basil flex items-center gap-2">
              📍 Showing products available in <strong>{buyerBarangay}</strong>
            </div>
          </div>
        )}
        <StatsSection />
        <TodaysDeals deals={deals} />
        <ProductGrid categories={dbCategories} products={dbProducts} activeCategory={category} />
        <FreshToday products={freshProducts} />
        <FeaturedSellers sellers={featuredSellers} />
        <WhyChooseUs />
        <TestimonialsSection reviews={testimonials} />
        <Newsletter />
      </div>

      <SiteFooter />
    </main>
  );
}