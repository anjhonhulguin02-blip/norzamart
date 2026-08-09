import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://norzamart.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/seller/dashboard",
        "/admin",
        "/messages",
        "/profile",
        "/cart",
        "/checkout",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
