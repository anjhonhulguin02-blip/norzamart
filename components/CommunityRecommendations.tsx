import ProductCard, { ProductCardData } from './ui/ProductCard';
import { HeartIcon } from './ui/NorzaIcons';

export default function CommunityRecommendations({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="nm-container nm-section">
      <p className="nm-kicker flex items-center gap-2"><HeartIcon size={16} /> Community favorites</p>
      <h2 className="nm-section-title mt-2">Recommended by your neighbors</h2>
      <p className="nm-section-copy mt-2 mb-5">Highly rated by buyers across Norzagaray.</p>
      <div className="nm-product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
