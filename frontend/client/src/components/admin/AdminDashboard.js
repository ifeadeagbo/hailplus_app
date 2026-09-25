// client/src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{dashboard?.totalUsers || 0}</p>
        </div>
        
        <div className="bg-green-500 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Products</h3>
          <p className="text-3xl font-bold">{dashboard?.totalProducts || 0}</p>
        </div>
        
        <div className="bg-purple-500 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl font-bold">{dashboard?.totalOrders || 0}</p>
        </div>
        
        <div className="bg-yellow-500 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Revenue</h3>
          <p className="text-3xl font-bold">${dashboard?.revenue?.toFixed(2) || '0.00'}</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-bold mb-4">Recent Orders</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboard?.recentOrders?.map(order => (
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;