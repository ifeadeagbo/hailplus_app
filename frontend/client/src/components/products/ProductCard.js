import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Fallback image if product image fails to load
  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&h=500&fit=crop';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/products/${product.id}`}>
        <img
          src={product.image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&h=500&fit=crop'}
          alt={product.name}
          className="w-full h-48 object-cover"
          onError={handleImageError}
        />
      </Link>
      
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-lg font-semibold mb-2 hover:text-blue-600">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-2xl font-bold text-green-600">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          
          <button
            onClick={handleAddToCart}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
        
        {product.stock > 0 && product.stock < 10 && (
          <p className="text-orange-500 text-sm mt-2">
            Only {product.stock} left in stock!
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;