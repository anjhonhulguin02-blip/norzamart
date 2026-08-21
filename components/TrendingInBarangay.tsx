import ProductCard, { ProductCardData } from './ui/ProductCard';
import { TrendIcon } from './ui/NorzaIcons';

export default function TrendingInBarangay({ barangay, products }: { barangay: string; products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="nm-container nm-section">
      <p className="nm-kicker flex items-center gap-2"><TrendIcon size={16} /> Popular nearby</p>
      <h2 className="nm-section-title mt-2">Trending in {barangay}</h2>
      <p className="nm-section-copy mt-2 mb-5">What your neighbors have been ordering lately.</p>
      <div className="nm-product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} badge="TRENDING" badgeColor="tomato" />
        ))}
      </div>
    </section>
  );
}
