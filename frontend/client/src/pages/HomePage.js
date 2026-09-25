import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import productService from '../services/productService';
import ProductList from '../components/products/ProductList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import store from '../config/store';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const products = await productService.getFeaturedProducts();
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section with Background Image */}
      <section 
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-12 mb-12 relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&h=600&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="max-w-3xl relative z-10">
          <h1 className="text-5xl font-bold mb-4">Welcome to {store.name}</h1>
          <p className="text-xl mb-8">
            Discover amazing products at unbeatable prices. Shop with confidence and enjoy fast delivery.
          </p>
          <Link
            to="/products"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Features Section with Icons */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
          <p className="text-gray-600">Carefully selected items from trusted brands</p>
        </div>

        <div className="text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
          <p className="text-gray-600">Competitive pricing with regular discounts</p>
        </div>

        <div className="text-center">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
          <p className="text-gray-600">Quick and reliable shipping worldwide</p>
        </div>
      </section>

      {/* Banner Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div 
          className="rounded-lg p-8 text-white relative overflow-hidden h-64"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Summer Sale</h3>
            <p className="mb-4">Up to 50% off on selected items</p>
            <Link to="/products?category=Clothing" className="bg-white text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-100">
              Shop Clothing
            </Link>
          </div>
        </div>

        <div 
          className="rounded-lg p-8 text-white relative overflow-hidden h-64"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Tech Deals</h3>
            <p className="mb-4">Latest gadgets at amazing prices</p>
            <Link to="/products?category=Electronics" className="bg-white text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-100">
              Shop Electronics
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center">Featured Products</h2>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <ProductList products={featuredProducts} loading={loading} />
        )}
      </section>

      {/* Newsletter Section with Background */}
      <section 
        className="rounded-lg p-8 mt-12 text-center relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&h=400&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-80"></div>
        <div className="relative z-10 text-white">
          <h2 className="text-2xl font-bold mb-4">Join Our Newsletter</h2>
          <p className="mb-6">
            Stay updated with our latest products and exclusive offers
          </p>
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-l-lg text-gray-900 focus:outline-none"
            />
            <button className="bg-green-500 text-white px-6 py-2 rounded-r-lg hover:bg-green-600 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="mt-12 py-8 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <p className="text-sm text-gray-600">Secure Payments</p>
          </div>
          
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <p className="text-sm text-gray-600">Fast Shipping</p>
          </div>
          
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <p className="text-sm text-gray-600">Easy Returns</p>
          </div>
          
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <p className="text-sm text-gray-600">24/7 Support</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;