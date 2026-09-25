import React from 'react';
import ProductCard from './ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';

const ProductList = ({ products, loading, columns = 'grid-cols-2 lg:grid-cols-4' }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">No products found.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${columns} gap-x-5 gap-y-10 sm:gap-x-7`}>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;
