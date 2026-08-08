import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Review from "@/lib/models/review";
import Seller from "@/lib/models/seller";
import SearchLog from "@/lib/models/searchlog";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const barangay = searchParams.get("barangay") || undefined;
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minRating = searchParams.get("minRating");
  const sort = searchParams.get("sort") || "newest";
  const q = searchParams.get("q")?.trim() || undefined;

  await connectToDatabase();

  const filter: any = { status: "active", approvalStatus: "approved" };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (q) {
    if (q.length >= 2) {
      SearchLog.findOneAndUpdate(
        { term: q.toLowerCase() },
        { $inc: { count: 1 } },
        { upsert: true }
      ).catch(() => {});
    }
    const matchingSellers = await Seller.find({ storeName: { $regex: q, $options: "i" } }).select("_id").lean();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { seller: { $in: matchingSellers.map((s: any) => s._id) } },
    ];
  }

  let sortOption: any = { createdAt: -1 };
  if (sort === "price_low") sortOption = { price: 1 };
  if (sort === "price_high") sortOption = { price: -1 };
  if (sort === "discount") sortOption = { createdAt: -1 }; // refined below

  let products = await Product.find(filter)
    .populate("seller", "storeName barangay status")
    .sort(sortOption)
    .limit(60)
    .lean() as any[];

  if (barangay) {
    products = products.filter((p: any) => p.seller?.barangay === barangay);
  }

  const productIds = products.map((p: any) => p._id);
  const ratingAgg = await Review.aggregate([
    { $match: { product: { $in: productIds } } },
    { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const ratingMap: Record<string, { avg: number; count: number }> = {};
  ratingAgg.forEach((r: any) => { ratingMap[r._id.toString()] = { avg: r.avg, count: r.count }; });

  let results = products.map((p: any) => ({
    id: p._id.toString(),
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image || "🛒",
    tag: p.tag,
    brgy: p.seller?.barangay || "",
    unit: p.unit || "piece",
    rating: ratingMap[p._id.toString()]?.avg ?? null,
    reviewCount: ratingMap[p._id.toString()]?.count ?? 0,
    sellerVerified: p.seller?.status === "approved",
  }));

  if (minRating) {
    const threshold = Number(minRating);
    results = results.filter((r) => (r.rating || 0) >= threshold);
  }

  if (sort === "rating") {
    results = results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
  if (sort === "discount") {
    results = results.sort((a, b) => {
      const discA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
      const discB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
      return discB - discA;
    });
  }

  return NextResponse.json({ products: results });
}
