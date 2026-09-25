import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/productService';
import ProductList from '../components/products/ProductList';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '',
    page: parseInt(searchParams.get('page') || '1')
  });

  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'];

  useEffect(() => {
    // Ignore responses that arrive after the filters changed again
    let stale = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getAllProducts(filters);
        if (stale) return;
        setProducts(response.products);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (!stale) setLoading(false);
      }
    };

    fetchProducts();
    return () => { stale = true; };
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v.toString());
    });
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange('search', e.target.search.value);
  };

  const handlePageChange = (newPage) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <input
                type="text"
                name="search"
                placeholder="Search products..."
                defaultValue={filters.search}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Search
              </button>
            </form>
            
            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Category</h3>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* Sort */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Sort By</h3>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
            
            {/* Clear Filters */}
            <button
              onClick={() => {
                setFilters({ category: '', search: '', sort: '', page: 1 });
                setSearchParams(new URLSearchParams());
              }}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="lg:w-3/4">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <ProductList products={products} loading={loading} />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center space-x-2">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-4 py-2 border rounded-lg ${
                        filters.page === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;