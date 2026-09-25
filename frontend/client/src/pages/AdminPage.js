import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/admin/AdminDashboard';
import ProductManager from '../components/admin/ProductManager';
import api from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Check admin access
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      toast.error('Access denied. Admin only.');
    }
  }, [isAdmin, navigate]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders(); // Refresh orders
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  // Update user role
  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated');
      fetchUsers(); // Refresh users
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-1/4">
          <div className="bg-white rounded-lg shadow p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'products'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                Products
              </button>
              
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'orders'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                Orders
              </button>
              
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                Users
              </button>
            </nav>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="md:w-3/4">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && <AdminDashboard />}
            
            {/* Products Tab */}
            {activeTab === 'products' && <ProductManager />}
            
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Order Management</h2>
                
                {loading ? (
                  <LoadingSpinner />
                ) : orders.length === 0 ? (
                  <p className="text-gray-500">No orders found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Order ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {order.id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {order.User?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              ${parseFloat(order.totalAmount).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">User Management</h2>
                
                {loading ? (
                  <LoadingSpinner />
                ) : users.length === 0 ? (
                  <p className="text-gray-500">No users found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <select
                                value={user.role}
                                onChange={(e) => updateUserRole(user.id, e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                              >
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;