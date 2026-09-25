import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import store from '../../config/store';

const Header = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            {store.name}
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/products" className="hover:text-blue-200">
              Products
            </Link>

            <Link to="/cart" className="relative hover:text-blue-200">
              Cart
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/orders" className="hover:text-blue-200">
                  Orders
                </Link>

                {isAdmin && (
                  <Link to="/admin" className="hover:text-blue-200">
                    Admin
                  </Link>
                )}

                <div className="flex items-center space-x-4">
                  <Link to="/account" className="text-sm hover:text-blue-200">
                    Hello, {user?.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;