import ProductCard, { ProductCardData } from './ui/ProductCard';
import { MapPinIcon } from './ui/NorzaIcons';

export default function ProductsNearYou({ barangay, products }: { barangay: string; products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="nm-container nm-section">
      <p className="nm-kicker flex items-center gap-2"><MapPinIcon size={16} /> Your barangay</p>
      <h2 className="nm-section-title mt-2">Products near you</h2>
      <p className="nm-section-copy mt-2 mb-5">Fresh finds from sellers right here in {barangay}.</p>
      <div className="nm-product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} badge="NEARBY" badgeColor="basil" />
        ))}
      </div>
    </section>
  );
}
