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

// Guests keep [{ productId, quantity }] in localStorage. The server prices
// it (POST /cart/quote) and it is merged into the account at login.
const GUEST_CART_KEY = 'guestCart';

const readGuestCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    return Array.isArray(items)
      ? items.filter(item => item && typeof item.productId === 'string' && item.quantity > 0)
      : [];
  } catch (error) {
    return [];
  }
};

const writeGuestCart = (items) => {
  try {
    if (items.length === 0) {
      localStorage.removeItem(GUEST_CART_KEY);
    } else {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
  } catch (error) {
    // Storage unavailable (private mode): the cart lasts for this page view
  }
};

const errorMessage = (error, fallback) => error.response?.data?.error || fallback;

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(null);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    // A discount belongs to one shopper; start fresh on login/logout
    setDiscount(null);
    setLoading(true);
    const load = async () => {
      if (isAuthenticated) {
        await mergeGuestCart();
      }
      await fetchCart(null);
    };
    load();
    // Reload only when the user logs in or out; fetchCart changes every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const fetchCart = async (discountCode = discount?.code) => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        const response = await cartService.getCart(discountCode);
        setCartItems(response.items || []);
        setCartSummary(response.summary || null);
        return;
      }

      const guestItems = readGuestCart();
      if (guestItems.length === 0) {
        setCartItems([]);
        setCartSummary(null);
        return;
      }

      const response = await cartService.quoteCart(guestItems, discountCode);
      // Keep storage in line with what is actually available
      writeGuestCart(response.items.map(({ productId, quantity }) => ({ productId, quantity })));
      if (response.unavailable.length > 0) {
        toast.warning('Some items in your cart are no longer available and were removed');
      }
      setCartItems(response.items);
      setCartSummary(response.summary);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
      setCartSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const updateGuestCart = async (update) => {
    writeGuestCart(update(readGuestCart()));
    await fetchCart();
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      if (isAuthenticated) {
        await cartService.addToCart(productId, quantity);
        await fetchCart();
      } else {
        await updateGuestCart(items => {
          const existing = items.find(item => item.productId === productId);
          return existing
            ? items.map(item => item === existing ? { ...item, quantity: Math.min(item.quantity + quantity, 100) } : item)
            : [...items, { productId, quantity }];
        });
      }
      toast.success('Item added to cart');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not add item to cart'));
      throw error;
    }
  };

  // For guests, cart item ids are product ids
  const updateQuantity = async (cartItemId, quantity) => {
    try {
      if (isAuthenticated) {
        await cartService.updateCartItem(cartItemId, quantity);
        await fetchCart();
      } else {
        await updateGuestCart(items =>
          items.map(item => item.productId === cartItemId ? { ...item, quantity } : item)
        );
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Could not update quantity'));
      throw error;
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      if (isAuthenticated) {
        await cartService.removeFromCart(cartItemId);
        await fetchCart();
      } else {
        await updateGuestCart(items => items.filter(item => item.productId !== cartItemId));
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Could not remove item'));
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        await cartService.clearCart();
      } else {
        writeGuestCart([]);
      }
      setCartItems([]);
      setCartSummary(null);
      setDiscount(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Could not clear cart'));
      throw error;
    }
  };

  const validateCart = async () => {
    const response = await cartService.validateCart();
    if (!response.valid && response.issues.length > 0) {
      response.issues.forEach(issue => {
        toast.warning(`${issue.productName || 'Item'}: ${issue.issue}`);
      });
      await fetchCart(); // Refresh cart with adjusted quantities
    }
    return response;
  };

  const applyDiscountCode = async (code) => {
    try {
      if (isAuthenticated) {
        const response = await cartService.applyDiscount(code);
        setDiscount(response.discount);
        setCartSummary(response.summary);
      } else {
        const response = await cartService.quoteCart(readGuestCart(), code);
        if (!response.discount) {
          throw new Error('Invalid discount code');
        }
        setDiscount({ code: response.discount.code, type: response.discount.type, value: response.discount.value });
        setCartSummary(response.summary);
      }
      toast.success('Discount applied successfully');
    } catch (error) {
      toast.error(errorMessage(error, 'Invalid discount code'));
      throw error;
    }
  };

  const removeDiscount = async () => {
    setDiscount(null);
    await fetchCart(null);
  };

  // Moves the guest cart into the account right after login or registration
  const mergeGuestCart = async () => {
    const guestItems = readGuestCart();
    if (guestItems.length === 0) return;

    try {
      const response = await cartService.mergeCarts(guestItems);
      writeGuestCart([]);
      if (response.failedItems?.length > 0) {
        toast.warning('Some items from your cart are no longer available');
      }
    } catch (error) {
      console.error('Error merging carts:', error);
    }
  };

  const getCartTotal = () => {
    if (cartSummary) {
      return parseFloat(cartSummary.total);
    }
    return 0;
  };

  const getCartCount = () => {
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
    removeDiscount,
    getCartTotal,
    getCartCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
