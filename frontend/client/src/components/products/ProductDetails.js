import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ProductDetails = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(product.id, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const productImage = imageError 
    ? 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&h=500&fit=crop'
    : (product.image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&h=500&fit=crop');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-auto rounded-lg shadow-lg"
          onError={handleImageError}
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        
        <p className="text-gray-600 mb-6">{product.description}</p>
        
        <div className="mb-6">
          <span className="text-3xl font-bold text-green-600">
            ${parseFloat(product.price).toFixed(2)}
          </span>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Category: {product.category}</p>
          <p className="text-sm">
            Stock: {' '}
            <span className={product.stock > 10 ? 'text-green-500' : 'text-orange-500'}>
              {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
            </span>
          </p>
        </div>

        {product.stock > 0 && (
          <div className="flex items-center space-x-4 mb-6">
            <label className="text-sm font-medium">Quantity:</label>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={handleQuantityChange}
              className="w-20 px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;