// client/src/context/CartContext.js (Enhanced Version)
import React, { createContext, useState, useContext, useEffect } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Load guest cart from localStorage
      const guestCart = localStorage.getItem('guestCart');
      if (guestCart) {
        setCartItems(JSON.parse(guestCart));
      } else {
        setCartItems([]);
      }
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCartItems(response.items || []);
      setCartSummary(response.summary || null);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      if (!isAuthenticated) {
        // Handle guest cart
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const existingItem = guestCart.find(item => item.productId === productId);
        
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          guestCart.push({ productId, quantity });
        }
        
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        setCartItems(guestCart);
        toast.success('Item added to cart');
        return;
      }

      const response = await cartService.addToCart(productId, quantity);
      await fetchCart(); // Refresh entire cart
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      await cartService.updateCartItem(cartItemId, quantity);
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await cartService.removeFromCart(cartItemId);
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCartItems([]);
      setCartSummary(null);
      setDiscount(null);
    } catch (error) {
      throw error;
    }
  };

  const validateCart = async () => {
    try {
      const response = await cartService.validateCart();
      if (!response.valid && response.issues.length > 0) {
        response.issues.forEach(issue => {
          toast.warning(`${issue.productName}: ${issue.issue}`);
        });
        await fetchCart(); // Refresh cart with adjusted quantities
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const applyDiscountCode = async (code) => {
    try {
      const response = await cartService.applyDiscount(code);
      setDiscount(response.discount);
      toast.success('Discount applied successfully');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid discount code');
      throw error;
    }
  };

  const mergeGuestCart = async () => {
    if (!isAuthenticated) return;
    
    const guestCart = localStorage.getItem('guestCart');
    if (guestCart) {
      try {
        const items = JSON.parse(guestCart);
        await cartService.mergeCarts(items);
        localStorage.removeItem('guestCart');
        await fetchCart();
      } catch (error) {
        console.error('Error merging carts:', error);
      }
    }
  };

  const getCartTotal = () => {
    if (cartSummary) {
      return parseFloat(cartSummary.total);
    }
    
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.Product?.price || 0) * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    if (cartSummary) {
      return cartSummary.itemCount;
    }
    
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    cartSummary,
    loading,
    discount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
    validateCart,
    applyDiscountCode,
    mergeGuestCart,
    getCartTotal,
    getCartCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};