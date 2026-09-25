import React from 'react';
import ProductCard from './ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';

const ProductList = ({ products, loading }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;