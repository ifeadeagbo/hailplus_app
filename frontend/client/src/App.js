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
import ErrorBoundary from './components/common/ErrorBoundary';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AdminPage from './pages/AdminPage';
import AccountPage from './pages/AccountPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import TermsPage from './pages/legal/TermsPage';
import CookiesPage from './pages/legal/CookiesPage';
import ReturnsPage from './pages/legal/ReturnsPage';
import FaqPage from './pages/legal/FaqPage';
import ContactPage from './pages/ContactPage';

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
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailsPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/cookies" element={<CookiesPage />} />
                    <Route path="/returns" element={<ReturnsPage />} />
                    <Route path="/faq" element={<FaqPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route
                      path="/account"
                      element={
                        <PrivateRoute>
                          <AccountPage />
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
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </ErrorBoundary>
              </main>
              <Footer />
              {/* Bottom-right so notices never cover the header's cart and account icons */}
              <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar />
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;