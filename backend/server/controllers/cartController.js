const { Cart, Product, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const { calculateTotals, findDiscount } = require('../utils/pricing');

// Cart summary for API responses (drops the internal cents breakdown)
const summarize = (cartItems, discountCode) => {
  const lines = cartItems
    .filter(item => item.Product)
    .map(item => ({ price: item.Product.price, quantity: item.quantity }));
  const { cents, ...summary } = calculateTotals(lines, discountCode);
  return summary;
};

// Get user's cart
exports.getCart = async (req, res, next) => {
  try {
    const cartItems = await Cart.findAll({
      where: { 
        userId: req.user.id, 
        isActive: true 
      },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'description', 'price', 'image', 'stock', 'category']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      items: cartItems,
      summary: summarize(cartItems, req.query.discountCode)
    });
  } catch (error) {
    next(error);
  }
};

// Add item to cart
exports.addToCart = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { productId, quantity = 1 } = req.body;
    
    // Validate quantity
    if (quantity < 1) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }
    
    // Check if product exists and is active
    const product = await Product.findOne({
      where: { 
        id: productId,
        active: true
      }
    });
    
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check stock availability
    if (product.stock < quantity) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Insufficient stock',
        available: product.stock
      });
    }
    
    // Check if item already exists in cart
    let cartItem = await Cart.findOne({
      where: { 
        userId: req.user.id, 
        productId, 
        isActive: true 
      },
      transaction
    });
    
    if (cartItem) {
      // Check if total quantity doesn't exceed stock
      const newQuantity = cartItem.quantity + quantity;
      
      if (newQuantity > product.stock) {
        await transaction.rollback();
        return res.status(400).json({ 
          error: 'Cannot add more items than available in stock',
          available: product.stock,
          inCart: cartItem.quantity
        });
      }
      
      // Update existing cart item
      cartItem.quantity = newQuantity;
      await cartItem.save({ transaction });
    } else {
      // Create new cart item
      cartItem = await Cart.create({
        userId: req.user.id,
        productId,
        quantity
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch updated cart item with product details
    cartItem = await Cart.findByPk(cartItem.id, {
      include: [{
        model: Product,
        attributes: ['id', 'name', 'description', 'price', 'image', 'stock', 'category']
      }]
    });
    
    res.status(201).json({
      message: 'Item added to cart',
      cartItem
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    // Validate quantity
    if (!quantity || quantity < 1) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    
    // Find cart item
    const cartItem = await Cart.findOne({
      where: { 
        id, 
        userId: req.user.id, 
        isActive: true 
      },
      include: [{ model: Product }],
      transaction
    });
    
    if (!cartItem) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    // Check stock
    if (cartItem.Product.stock < quantity) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Insufficient stock',
        available: cartItem.Product.stock
      });
    }
    
    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save({ transaction });
    
    await transaction.commit();
    
    res.json({
      message: 'Cart updated',
      cartItem
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const cartItem = await Cart.findOne({
      where: { 
        id, 
        userId: req.user.id, 
        isActive: true 
      }
    });
    
    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    // Soft delete - mark as inactive
    cartItem.isActive = false;
    await cartItem.save();
    
    // Alternative: Hard delete
    // await cartItem.destroy();
    
    res.json({ 
      message: 'Item removed from cart',
      removedItemId: id
    });
  } catch (error) {
    next(error);
  }
};

// Clear entire cart
exports.clearCart = async (req, res, next) => {
  try {
    // Soft delete all active cart items
    await Cart.update(
      { isActive: false },
      { 
        where: { 
          userId: req.user.id, 
          isActive: true 
        } 
      }
    );
    
    // Alternative: Hard delete
    // await Cart.destroy({
    //   where: { 
    //     userId: req.user.id, 
    //     isActive: true 
    //   }
    // });
    
    res.json({ 
      message: 'Cart cleared successfully',
      cleared: true
    });
  } catch (error) {
    next(error);
  }
};

// Merge guest cart with user cart (for when user logs in)
exports.mergeCarts = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { guestCartItems } = req.body;
    
    if (!Array.isArray(guestCartItems) || guestCartItems.length === 0) {
      return res.json({ message: 'No items to merge' });
    }
    
    const mergedItems = [];
    const failedItems = [];
    
    for (const item of guestCartItems) {
      try {
        const { productId, quantity } = item;
        
        // Check product availability
        const product = await Product.findByPk(productId, { transaction });
        
        if (!product || !product.active) {
          failedItems.push({
            productId,
            reason: 'Product not available'
          });
          continue;
        }
        
        // Check existing cart item
        let cartItem = await Cart.findOne({
          where: { 
            userId: req.user.id, 
            productId, 
            isActive: true 
          },
          transaction
        });
        
        if (cartItem) {
          // Merge quantities (up to stock limit)
          const newQuantity = Math.min(
            cartItem.quantity + quantity,
            product.stock
          );
          cartItem.quantity = newQuantity;
          await cartItem.save({ transaction });
        } else {
          // Add new item
          const addQuantity = Math.min(quantity, product.stock);
          cartItem = await Cart.create({
            userId: req.user.id,
            productId,
            quantity: addQuantity
          }, { transaction });
        }
        
        mergedItems.push(cartItem);
      } catch (error) {
        failedItems.push({
          productId: item.productId,
          reason: 'Failed to add item'
        });
      }
    }
    
    await transaction.commit();
    
    res.json({
      message: 'Cart merge completed',
      mergedItems: mergedItems.length,
      failedItems
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Get cart count (for header badge)
exports.getCartCount = async (req, res, next) => {
  try {
    const count = await Cart.sum('quantity', {
      where: { 
        userId: req.user.id, 
        isActive: true 
      }
    });
    
    res.json({ 
      count: count || 0 
    });
  } catch (error) {
    next(error);
  }
};

// Validate cart before checkout
exports.validateCart = async (req, res, next) => {
  try {
    const cartItems = await Cart.findAll({
      where: { 
        userId: req.user.id, 
        isActive: true 
      },
      include: [{ model: Product }]
    });
    
    if (cartItems.length === 0) {
      return res.status(400).json({ 
        valid: false,
        error: 'Cart is empty' 
      });
    }
    
    const issues = [];
    const validItems = [];
    
    for (const item of cartItems) {
      // Check if product still exists and is active
      if (!item.Product || !item.Product.active) {
        issues.push({
          itemId: item.id,
          productId: item.productId,
          issue: 'Product no longer available'
        });
        continue;
      }
      
      // Check stock
      if (item.Product.stock < item.quantity) {
        issues.push({
          itemId: item.id,
          productId: item.productId,
          productName: item.Product.name,
          issue: `Only ${item.Product.stock} items available`,
          requestedQuantity: item.quantity,
          availableQuantity: item.Product.stock
        });
        
        // Auto-adjust quantity to available stock
        if (item.Product.stock > 0) {
          item.quantity = item.Product.stock;
          await item.save();
          validItems.push(item);
        }
      } else {
        validItems.push(item);
      }
    }
    
    const isValid = issues.length === 0;
    
    res.json({
      valid: isValid,
      issues,
      validItems: validItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.Product.name,
        price: item.Product.price,
        quantity: item.quantity,
        subtotal: parseFloat(item.Product.price) * item.quantity
      })),
      summary: summarize(validItems, req.query.discountCode),
      message: isValid ? 'Cart is valid' : 'Cart has issues that need attention'
    });
  } catch (error) {
    next(error);
  }
};

// Apply discount code to cart
exports.applyDiscount = async (req, res, next) => {
  try {
    const discount = findDiscount(req.body.discountCode);
    
    if (!discount) {
      return res.status(400).json({ 
        error: 'Invalid discount code' 
      });
    }
    
    const cartItems = await Cart.findAll({
      where: { 
        userId: req.user.id, 
        isActive: true 
      },
      include: [{ model: Product }]
    });
    
    const summary = summarize(cartItems, discount.code);
    
    res.json({
      message: 'Discount applied',
      discount: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        discountAmount: summary.discountAmount,
        finalTotal: summary.total
      },
      summary
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;