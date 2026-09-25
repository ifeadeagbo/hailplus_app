import React from 'react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = async (e) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0) {
      await updateQuantity(item.id, newQuantity);
    }
  };

  const handleRemove = async () => {
    await removeFromCart(item.id);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=100&h=100&fit=crop';
  };

  return (
    <div className="flex items-center justify-between border-b py-4">
      <div className="flex items-center space-x-4">
        <img
          src={item.Product?.image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=100&h=100&fit=crop'}
          alt={item.Product?.name}
          className="w-20 h-20 object-cover rounded"
          onError={handleImageError}
        />
        
        <div>
          <h3 className="font-semibold">{item.Product?.name}</h3>
          <p className="text-gray-500 text-sm">{formatPrice(item.Product?.price)}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <input
          type="number"
          min="1"
          max={item.Product?.stock}
          value={item.quantity}
          onChange={handleQuantityChange}
          className="w-20 px-2 py-1 border rounded focus:outline-none focus:border-blue-500"
        />
        
        <span className="font-semibold">
          {formatPrice(parseFloat(item.Product?.price) * item.quantity)}
        </span>
        
        <button
          onClick={handleRemove}
          className="text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem;