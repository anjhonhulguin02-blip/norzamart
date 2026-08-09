import type { MetadataRoute } from "next";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";

const BASE_URL = process.env.NEXTAUTH_URL || "https://norzamart.vercel.app";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
  { url: `${BASE_URL}/search`, changeFrequency: "daily", priority: 0.8 },
  { url: `${BASE_URL}/seller/register`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.3 },
  { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
  { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDatabase();

  const products = await Product.find({ status: "active", approvalStatus: "approved" })
    .select("_id updatedAt")
    .lean();

  const sellers = await Seller.find({ status: "approved" })
    .select("_id updatedAt")
    .lean();

  const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
    url: `${BASE_URL}/product/${p._id.toString()}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const sellerRoutes: MetadataRoute.Sitemap = sellers.map((s: any) => ({
    url: `${BASE_URL}/seller/${s._id.toString()}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...STATIC_ROUTES, ...sellerRoutes, ...productRoutes];
}
