import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import ProductDetails from '../components/products/ProductDetails';
import ProductList from '../components/products/ProductList';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
          limit: 5 
        });
        if (stale) return;
        setRelatedProducts(related.products.filter(p => p.id !== id).slice(0, 4));
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <div className="shop-container py-24 text-center">
        <h2 className="section-title">Product not found</h2>
      </div>
    );
  }

  return (
    <div className="shop-container py-10">
      <nav className="text-[11px] uppercase tracking-label text-muted mb-8">
        <Link to="/" className="hover:text-ink">Home</Link>
        <span className="mx-2">/</span>
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-ink">{product.category}</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <ProductDetails product={product} />

      {relatedProducts.length > 0 && (
        <section className="mt-24">
          <div className="text-center mb-10">
            <p className="eyebrow mb-3">You may also like</p>
            <h2 className="section-title">Related products</h2>
          </div>
          <ProductList products={relatedProducts} />
        </section>
      )}
    </div>
  );
};

export default ProductDetailsPage;
