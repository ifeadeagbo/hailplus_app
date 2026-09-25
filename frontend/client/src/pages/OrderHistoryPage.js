import React, { useState, useEffect } from 'react';
import orderService from '../services/orderService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { formatPrice } from '../utils/format';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await orderService.cancelOrder(orderId);
        toast.success('Order cancelled successfully');
        fetchOrders();
      } catch (error) {
        toast.error('Failed to cancel order');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>
        <div className="text-center py-12">
          <p className="text-gray-600">You haven't placed any orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Order History</h1>
      
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Order #{order.id.substring(0, 8)}
                </h2>
                <p className="text-gray-600">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <p className="mt-2 text-xl font-bold">
                  {formatPrice(order.totalAmount)}
                </p>
              </div>
            </div>
            
            {order.trackingNumber && (
              <p className="text-sm text-gray-600 mb-4">
                Tracking: {order.trackingNumber}
              </p>
            )}
            
            <button
              onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              {selectedOrder === order.id ? 'Hide Details' : 'Show Details'}
            </button>
            
            {selectedOrder === order.id && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.name} x {item.quantity}</span>
                      <span>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                    {order.shippingAddress.address}<br />
                    {[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(', ')}<br />
                    {order.shippingAddress.zipCode}
                  </p>
                </div>
              </div>
            )}
            
            {(order.status === 'pending' || order.status === 'processing') && (
              <button
                onClick={() => handleCancelOrder(order.id)}
                className="mt-4 text-red-600 hover:text-red-800"
              >
                Cancel Order
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistoryPage;