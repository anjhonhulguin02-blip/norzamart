import connectToDatabase from '@/lib/mongodb';
import Product from '@/lib/models/product';
import Seller from '@/lib/models/seller';
import User from '@/lib/models/user';
import Navbar from '@/components/Navbar';
import ProductDetailClient from '@/components/ProductDetailClient';
import RelatedProducts from '@/components/RelatedProducts';
import { notFound } from 'next/navigation';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/siteUrl';

void Seller;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  await connectToDatabase();
  const product = await Product.findById(id)
    .select('name description image price unit category approvalStatus')
    .populate('seller', 'storeName')
    .lean() as any;

  if (!product || product.approvalStatus !== 'approved') {
    return { title: 'Product Not Found' };
  }

  const title = product.name;
  const description = product.description
    ? product.description.slice(0, 155)
    : `${product.name} — ₱${product.price}/${product.unit || 'piece'} from ${product.seller?.storeName || 'a local seller'} on NorzaMart.`;

  // Some product images are stored as base64 data URIs rather than hosted URLs;
  // og:image/twitter:image require a fetchable http(s) URL, so skip those and
  // let the root opengraph-image fallback take over instead.
  const hasLinkableImage = typeof product.image === 'string' && /^https?:\/\//.test(product.image);

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${id}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [hasLinkableImage ? { url: product.image } : { url: '/opengraph-image' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [hasLinkableImage ? product.image : '/opengraph-image'],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await connectToDatabase();
  const product = await Product.findById(id).populate('seller', 'storeName barangay deliveryBarangays estimatedDeliveryTime').lean() as any;

  if (!product || product.status !== 'active' || product.approvalStatus !== 'approved') {
    notFound();
  }

  const session = await getServerSession(authOptions);
  let buyerBarangay = '';
  if (session?.user) {
    const buyerDoc = await User.findById((session.user as any).id).select('settings');
    buyerBarangay = buyerDoc?.settings?.barangay || '';
  }

  const galleryImages = [product.image, ...(product.images || [])].filter(Boolean);
  const deliveryBarangays = (product.availableBarangays?.length ? product.availableBarangays : product.seller?.deliveryBarangays) || [];

  const linkableImages = galleryImages.filter((img: string) => /^https?:\/\//.test(img));
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: linkableImages.length ? linkableImages : undefined,
    category: product.category || undefined,
    sku: product._id.toString(),
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/product/${product._id.toString()}`,
      priceCurrency: "PHP",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: product.seller?.storeName ? { "@type": "Organization", name: product.seller.storeName } : undefined,
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      ...(product.category
        ? [{ "@type": "ListItem", position: 2, name: product.category, item: `${BASE_URL}/search?category=${encodeURIComponent(product.category)}` }]
        : []),
      { "@type": "ListItem", position: product.category ? 3 : 2, name: product.name, item: `${BASE_URL}/product/${product._id.toString()}` },
    ],
  };

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Navbar />
      <ProductDetailClient
        productId={product._id.toString()}
        sellerId={product.seller?._id?.toString() || ''}
        name={product.name}
        price={product.price}
        originalPrice={product.originalPrice}
        stock={product.stock}
        unit={product.unit || 'piece'}
        images={galleryImages}
        category={product.category}
        sellerName={product.seller?.storeName || 'Unknown Seller'}
        sellerBarangay={product.seller?.barangay || ''}
        deliveryBarangays={deliveryBarangays}
        deliveryFee={product.deliveryFee}
        buyerBarangay={buyerBarangay}
        description={product.description}
        tag={product.tag}
        createdAt={product.createdAt}
        weight={product.weight}
        origin={product.origin}
        freshUntil={product.freshUntil}
        soldCount={product.soldCount || 0}
        estimatedDeliveryTime={product.seller?.estimatedDeliveryTime || ''}
      />
      <RelatedProducts productId={product._id.toString()} />
    </main>
  );
}