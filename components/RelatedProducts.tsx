"use client";

import React, { useEffect, useState } from 'react';
import ProductCard from './ui/ProductCard';

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  unit: string;
  brgy: string;
}

export default function RelatedProducts({ productId }: { productId: string }) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/related/${productId}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading || products.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 mt-14 border-t border-ink/10 pt-8">
      <h2 className="font-display text-xl font-semibold text-basil mb-5">You Might Also Like</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} compact />
        ))}
      </div>
    </div>
  );
}