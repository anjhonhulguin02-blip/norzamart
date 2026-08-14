import type { Metadata } from "next";
import { Fraunces, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";
import ToastProvider from "../components/ui/Toast";
import AuthPromptProvider from "../components/AuthPromptProvider";
import OfflineBanner from "../components/OfflineBanner";
import { BASE_URL } from "../lib/siteUrl";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Fresh vegetables, meat, and daily groceries from local sellers in Norzagaray, Bulacan — delivered same-day.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "NorzaMart — Fresh, Local Groceries in Norzagaray",
    template: "%s | NorzaMart",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "Norzagaray",
    "Bulacan",
    "grocery delivery",
    "online palengke",
    "local marketplace",
    "sari-sari store online",
    "fresh produce delivery Philippines",
  ],
  openGraph: {
    title: "NorzaMart — Fresh, Local Groceries in Norzagaray",
    description: SITE_DESCRIPTION,
    url: BASE_URL,
    siteName: "NorzaMart",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NorzaMart — Fresh, Local Groceries in Norzagaray",
    description: SITE_DESCRIPTION,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "NorzaMart",
  url: BASE_URL,
  description: SITE_DESCRIPTION,
  areaServed: {
    "@type": "City",
    name: "Norzagaray, Bulacan",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-cream-mist text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AuthProvider>
          <ToastProvider>
            <AuthPromptProvider>{children}</AuthPromptProvider>
          </ToastProvider>
        </AuthProvider>
        <OfflineBanner />
      </body>
    </html>
  );
}