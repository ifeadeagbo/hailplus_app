import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import ProductDetails from '../components/products/ProductDetails';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatPrice } from '../utils/format';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    // Ignore responses for a product the user has already navigated away from
    let stale = false;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await productService.getProductById(id);
        if (stale) return;
        setProduct(productData);
        
        // Fetch related products
        const related = await productService.getAllProducts({ 
          category: productData.category,
          limit: 4 
        });
        if (stale) return;
        setRelatedProducts(related.products.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error fetching product:', error);
        if (!stale) navigate('/products');
      } finally {
        if (!stale) setLoading(false);
      }
    };

    fetchProduct();
    return () => { stale = true; };
  }, [id, navigate]);

  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200&h=200&fit=crop';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Back
      </button>
      
      <ProductDetails product={product} />
      
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="cursor-pointer border rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <img
                  src={p.image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200&h=200&fit=crop'}
                  alt={p.name}
                  className="w-full h-48 object-cover mb-4 rounded"
                  onError={handleImageError}
                />
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-green-600 font-bold">{formatPrice(p.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2">4.5 out of 5 (124 reviews)</span>
          </div>
          <p className="text-gray-600 italic">Reviews feature coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;