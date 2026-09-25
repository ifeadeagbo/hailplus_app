import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import productService from '../services/productService';
import ProductList from '../components/products/ProductList';
import store from '../config/store';

const PAGE_SIZE = 12;

const sortOptions = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' }
];

const ProductsPage = () => {
  // The URL is the source of truth, so header links and search work from any page
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '';
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ignore responses that arrive after the filters changed again
    let stale = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getAllProducts({ category, search, sort, page, limit: PAGE_SIZE });
        if (stale) return;
        setProducts(response.products);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (!stale) setLoading(false);
      }
    };

    fetchProducts();
    return () => { stale = true; };
  }, [category, search, sort, page]);

  const updateParams = (changes) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    if (!('page' in changes)) params.delete('page');
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search: e.target.search.value.trim() });
  };

  const title = search ? `Results for “${search}”` : category || 'Shop';
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <div className="bg-cream py-12 text-center">
        <nav className="text-[11px] uppercase tracking-label text-muted mb-3">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-ink">Shop</Link>
          {category && (<><span className="mx-2">/</span><span className="text-ink">{category}</span></>)}
        </nav>
        <h1 className="section-title">{title}</h1>
      </div>

      <div className="shop-container py-12 flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-60 shrink-0 space-y-10">
          <form onSubmit={handleSearch} key={search}>
            <h2 className="text-xs font-semibold uppercase tracking-label mb-4">Search</h2>
            <div className="flex">
              <input name="search" type="search" defaultValue={search} placeholder="Search products..." className="field" />
              <button type="submit" aria-label="Search" className="px-4 bg-ink text-white hover:bg-accent">
                <i className="fa-solid fa-magnifying-glass text-sm"></i>
              </button>
            </div>
          </form>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-label mb-4">Categories</h2>
            <ul className="space-y-1 text-sm">
              {['', ...store.categories].map(name => (
                <li key={name || 'all'}>
                  <button
                    onClick={() => updateParams({ category: name })}
                    className={`w-full text-left py-1.5 transition-colors ${
                      category === name ? 'text-accent font-medium' : 'text-ink/80 hover:text-accent'
                    }`}
                  >
                    {name || 'All products'}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {(category || search || sort) && (
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="text-xs uppercase tracking-label border-b border-ink pb-0.5 hover:text-accent hover:border-accent"
            >
              Clear all filters
            </button>
          )}
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-8 border-b border-line">
            <p className="text-sm text-muted">
              {loading ? 'Loading...' : `Showing ${first}–${last} of ${total} products`}
            </p>
            <label className="flex items-center gap-3 text-sm">
              <span className="text-muted">Sort by</span>
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="border border-line px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <ProductList products={products} loading={loading} columns="grid-cols-2 lg:grid-cols-3" />

          {totalPages > 1 && (
            <nav className="mt-14 flex justify-center gap-2">
              <button
                onClick={() => updateParams({ page: String(page - 1) })}
                disabled={page === 1}
                aria-label="Previous page"
                className="h-10 w-10 border border-line hover:border-ink disabled:opacity-30 disabled:hover:border-line"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => updateParams({ page: String(n) })}
                  className={`h-10 w-10 text-sm border ${n === page ? 'bg-ink text-white border-ink' : 'border-line hover:border-ink'}`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => updateParams({ page: String(page + 1) })}
                disabled={page === totalPages}
                aria-label="Next page"
                className="h-10 w-10 border border-line hover:border-ink disabled:opacity-30 disabled:hover:border-line"
              >
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
