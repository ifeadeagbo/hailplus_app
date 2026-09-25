import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PrivateRoute from './components/common/PrivateRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AdminPage from './pages/AdminPage';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const queryClient = new QueryClient();
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="App">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:id" element={<ProductDetailsPage />} />
                  <Route
                    path="/cart"
                    element={
                      <PrivateRoute>
                        <CartPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <PrivateRoute>
                        <Elements stripe={stripePromise}>
                          <CheckoutPage />
                        </Elements>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <PrivateRoute>
                        <OrderHistoryPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <PrivateRoute adminOnly>
                        <AdminPage />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </main>
              <Footer />
              <ToastContainer />
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;