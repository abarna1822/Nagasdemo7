import { useState } from 'react';
import { Check, Eye, Plus } from 'lucide-react';
import type { Product } from '../types/commerce';
import { formatINR } from '../utils/commerce';
import { useNagasStore } from '../store/StoreContext';
import { ProductMedia } from './ProductMedia';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  aspect?: '4/5' | '4/3';
}

export function ProductCard({
  product,
  onQuickView,
  aspect = '4/3',
}: ProductCardProps) {
  const { addToCart } = useNagasStore();
  const [selectedFormat, setSelectedFormat] = useState(
    product.variants[0]?.format ?? ''
  );
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant =
    product.variants.find((v) => v.format === selectedFormat) ??
    product.variants[0];

  const handleAdd = () => {
    if (product.soldOut || !activeVariant) return;
    addToCart(product, activeVariant.format, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article className="group bg-[#FFFDF9] border border-[#1D1714]/10 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`relative overflow-hidden bg-[#FBF8F3] ${
          aspect === '4/5' ? 'aspect-[4/5]' : 'aspect-[4/3]'
        }`}
      >
        <ProductMedia
          src={product.imageUrl}
          alt={product.name}
          focus={product.imageFocus}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {product.soldOut && (
          <div className="absolute inset-0 bg-[#1D1714]/45 flex items-center justify-center">
            <span className="border-2 border-[#FFFDF9] text-[#FFFDF9] font-display font-bold tracking-widest uppercase px-4 py-1.5 text-sm -rotate-6 bg-[#1E140E]/90">
              Sold Out
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onQuickView(product)}
          aria-label={`Quick view ${product.name}`}
          className="absolute top-3 right-3 p-2 rounded-lg bg-[#FFFDF9]/90 text-[#1D1714] hover:bg-[#FFFDF9] shadow-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <p className="text-xs text-[#1D1714]/60 tracking-wide truncate">
            {product.origin} ·{' '}
            {product.category === 'dry-fruits'
              ? 'Pouch & Box Range'
              : product.category === 'honey'
              ? 'Honey Collections'
              : 'Dates & More'}
          </p>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-[#1D1714] leading-snug">
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="text-left hover:text-[#4A3222] transition-colors cursor-pointer"
              >
                {product.name}
              </button>
            </h3>
            <span className="font-display text-lg font-bold text-[#4A3222] tabular-nums shrink-0">
              {activeVariant ? formatINR(activeVariant.price) : '—'}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#1D1714]/70 line-clamp-2">
            {product.tastingNote}
          </p>
        </div>

        {/* Format variants */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-[#1D1714]/8">
          {product.variants.map((variant) => {
            const active = variant.format === activeVariant?.format;
            return (
              <button
                key={variant.format}
                type="button"
                onClick={() => setSelectedFormat(variant.format)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#1D1714] text-[#FFFDF9]'
                    : 'bg-[#FBF8F3] text-[#1D1714]/80 hover:bg-[#1D1714]/10'
                }`}
              >
                {variant.format}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={product.soldOut}
            onClick={handleAdd}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              justAdded
                ? 'bg-[#1E8449] text-[#FFFDF9]'
                : 'bg-[#4A3222] text-[#FFFDF9] hover:bg-[#1E140E]'
            }`}
          >
            {product.soldOut ? (
              <span>Sold Out</span>
            ) : justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="py-2 px-3 rounded-lg border border-[#1D1714]/20 text-xs font-medium text-[#1D1714] hover:bg-[#FBF8F3] transition-colors whitespace-nowrap cursor-pointer"
          >
            Details
          </button>
        </div>
      </div>
    </article>
  );
}
