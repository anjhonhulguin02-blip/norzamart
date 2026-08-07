import ProductCard from './ui/ProductCard';

interface FreshProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  image?: string;
  category: string;
}

export default function FreshToday({ products }: { products: FreshProduct[] }) {
  if (products.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-14">
      <h2 className="text-xl font-black text-gray-900 tracking-tight drop-shadow-sm mb-4">🌱 Fresh Today</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} badge="NEW TODAY" badgeColor="basil" />
        ))}
      </div>
    </div>
  );
}