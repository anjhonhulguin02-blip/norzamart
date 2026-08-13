import ProductCard, { ProductCardData } from './ui/ProductCard';

export default function ProductsNearYou({ barangay, products }: { barangay: string; products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm mb-1">📍 Products Near You</h2>
      <p className="text-ink/50 text-xs font-body mb-4">From sellers right here in {barangay}.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} badge="NEARBY" badgeColor="basil" />
        ))}
      </div>
    </div>
  );
}
