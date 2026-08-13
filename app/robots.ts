import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/siteUrl";

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
        "/verify-email",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
