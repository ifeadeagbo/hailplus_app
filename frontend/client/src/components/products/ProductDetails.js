import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice, formatShortPrice } from '../../utils/format';
import store from '../../config/store';
import { FALLBACK_IMAGE } from './ProductCard';

const LOW_STOCK = 5;

const ProductDetails = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();
  const soldOut = product.stock === 0;

  const changeQuantity = (next) => setQuantity(Math.min(Math.max(next, 1), product.stock));

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addToCart(product.id, quantity);
    } catch (error) {
      // The cart context already showed the error
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
      <div className="bg-cream aspect-square overflow-hidden">
        <img
          src={product.image || FALLBACK_IMAGE}
          alt={product.name}
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="md:py-4">
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="eyebrow hover:text-ink">
          {product.category}
        </Link>
        <h1 className="mt-3 font-display text-3xl lg:text-4xl font-normal tracking-wide">{product.name}</h1>
        <p className="mt-4 text-2xl font-semibold">{formatPrice(product.price)}</p>

        <p className={`mt-4 text-sm flex items-center gap-2 ${soldOut ? 'text-red-600' : product.stock <= LOW_STOCK ? 'text-accent' : 'text-green-700'}`}>
          <span className="h-2 w-2 rounded-full bg-current"></span>
          {soldOut ? 'Sold out' : product.stock <= LOW_STOCK ? `Only ${product.stock} left in stock` : 'In stock'}
        </p>

        <p className="mt-6 text-ink/80 leading-relaxed border-t border-line pt-6">{product.description}</p>

        {!soldOut && (
          <div className="mt-8 flex gap-3">
            <div className="flex border border-line">
              <button onClick={() => changeQuantity(quantity - 1)} aria-label="Decrease quantity" className="w-11 hover:bg-cream">−</button>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => changeQuantity(parseInt(e.target.value) || 1)}
                aria-label="Quantity"
                className="w-12 text-center text-sm focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button onClick={() => changeQuantity(quantity + 1)} aria-label="Increase quantity" className="w-11 hover:bg-cream">+</button>
            </div>
            <button onClick={handleAddToCart} disabled={adding} className="btn-dark flex-1">
              {adding ? 'Adding...' : 'Add to cart'}
            </button>
          </div>
        )}

        <ul className="mt-8 space-y-3 text-sm text-ink/80 border-t border-line pt-6">
          <li className="flex items-center gap-3">
            <i className="fa-solid fa-truck-fast w-5 text-accent"></i>
            Free UK delivery on orders over {formatShortPrice(store.freeShippingOver)}
          </li>
          <li className="flex items-center gap-3">
            <i className="fa-solid fa-rotate-left w-5 text-accent"></i>
            {store.returnWindowDays}-day returns. <Link to="/returns" className="underline hover:text-accent">Details</Link>
          </li>
          <li className="flex items-center gap-3">
            <i className="fa-solid fa-lock w-5 text-accent"></i>
            Secure card payment with Stripe
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProductDetails;
