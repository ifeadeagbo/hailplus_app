import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=800&fit=crop';
const LOW_STOCK = 5;

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const soldOut = product.stock === 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      await addToCart(product.id, 1);
    } catch (error) {
      // The cart context already showed the error
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group">
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden bg-cream aspect-portrait">
        <img
          src={product.image || FALLBACK_IMAGE}
          alt={product.name}
          loading="lazy"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${soldOut ? 'opacity-60' : ''}`}
        />

        {soldOut ? (
          <span className="absolute top-3 left-3 bg-white text-ink text-[10px] uppercase tracking-label px-2.5 py-1">
            Sold out
          </span>
        ) : product.stock <= LOW_STOCK && (
          <span className="absolute top-3 left-3 bg-accent text-white text-[10px] uppercase tracking-label px-2.5 py-1">
            Only {product.stock} left
          </span>
        )}

        {!soldOut && (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="absolute inset-x-0 bottom-0 bg-ink/90 text-white text-[11px] font-semibold uppercase tracking-label py-3.5
              transition-transform duration-300 lg:translate-y-full lg:group-hover:translate-y-0 hover:bg-accent disabled:opacity-70"
          >
            {adding ? 'Adding...' : 'Add to cart'}
          </button>
        )}
      </Link>

      <div className="pt-4 text-center">
        <Link
          to={`/products?category=${encodeURIComponent(product.category)}`}
          className="text-[10px] uppercase tracking-label text-muted hover:text-accent"
        >
          {product.category}
        </Link>
        <h3 className="mt-1.5 font-sans text-sm text-ink">
          <Link to={`/products/${product.id}`} className="hover:text-accent transition-colors">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm font-semibold">{formatPrice(product.price)}</p>
      </div>
    </div>
  );
};

export default ProductCard;
