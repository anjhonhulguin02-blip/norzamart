import ProductCard, { ProductCardData } from './ui/ProductCard';

export default function CommunityRecommendations({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm mb-1">💚 Community Recommendations</h2>
      <p className="text-ink/50 text-xs font-body mb-4">Highly rated by buyers across Norzagaray.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
