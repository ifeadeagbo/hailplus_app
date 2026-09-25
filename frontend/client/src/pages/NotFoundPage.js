import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="container mx-auto px-4 py-24 text-center">
    <h1 className="text-5xl font-bold text-gray-300 mb-4">404</h1>
    <h2 className="text-2xl font-semibold mb-2">Page not found</h2>
    <p className="text-gray-600 mb-8">The page you're looking for doesn't exist or has moved.</p>
    <Link to="/products" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
      Continue shopping
    </Link>
  </div>
);

export default NotFoundPage;
