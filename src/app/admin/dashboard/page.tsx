/**
 * @file src/app/admin/dashboard/page.tsx
 * @description Enhanced admin dashboard with comprehensive order and user management.
 * Features statistics, advanced search, pagination, and bulk operations.
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import OrderTable from "@/components/admin/OrderTable";
import VerificationQueue from "@/components/admin/VerificationQueue";
import AdminStats from "@/components/admin/AdminStats";
import { LogOut, Settings, Download, RefreshCw } from "lucide-react";

/**
 * Order interface matching Prisma schema
 */
interface Order {
  id: string;
  name: string;
  phone: string;
  pages: number;
  tokenId: string;
  copies: number;
  notes?: string;
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'VERIFIED';
  files: string[];
  createdAt: Date;
  user: {
    phone: string;
    tokenId: string;
    isVerified: boolean;
  };
}

/**
 * User interface for verification queue
 */
interface User {
  id: string;
  phone: string;
  tokenId: string;
  isVerified: boolean;
  createdAt: Date;
  orders: {
    id: string;
    name: string;
    status: string;
    totalAmount: number;
  }[];
}

/**
 * Statistics data interface
 */
interface AdminStatsData {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  pendingRevenue: number;
  verifiedUsers: number;
  pendingVerifications: number;
  recentOrders: number;
}

/**
 * AdminDashboard component with enhanced functionality
 * @returns JSX element for admin dashboard
 */
const AdminDashboard = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStatsData>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    recentOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    adminPasscode: '',
    maxFileSize: 10,
    uploadTimeout: 60,
    enableNotifications: true,
    autoVerifyUsers: false
  });

  /**
   * Loads dashboard data
   */
  useEffect(() => {
    loadDashboardData();
  }, []);

  /**
   * Loads all dashboard data including orders, users, and statistics
   */
  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch all data in parallel for better performance
      const [ordersResponse, usersResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/orders?limit=50'),
        fetch('/api/admin/users?limit=50'),
        fetch('/api/admin/stats')
      ]);

      // Handle orders data
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.data.orders);
      } else {
        console.error('Failed to fetch orders:', ordersResponse.statusText);
        setOrders([]);
      }

      // Handle users data
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data.users);
      } else {
        console.error('Failed to fetch users:', usersResponse.statusText);
        setUsers([]);
      }

      // Handle statistics data
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalOrders: statsData.data.totalOrders,
          pendingOrders: statsData.data.pendingOrders,
          completedOrders: statsData.data.completedOrders,
          cancelledOrders: statsData.data.cancelledOrders,
          totalRevenue: statsData.data.totalRevenue,
          pendingRevenue: statsData.data.pendingRevenue,
          verifiedUsers: statsData.data.verifiedUsers,
          pendingVerifications: statsData.data.pendingVerifications,
          recentOrders: statsData.data.recentOrders,
        });
      } else {
        console.error('Failed to fetch stats:', statsResponse.statusText);
        // Set default stats if API fails
        setStats({
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
          pendingRevenue: 0,
          verifiedUsers: 0,
          pendingVerifications: 0,
          recentOrders: 0,
        });
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty data on error
      setOrders([]);
      setUsers([]);
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        pendingRevenue: 0,
        verifiedUsers: 0,
        pendingVerifications: 0,
        recentOrders: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates order status
   * @param orderId - ID of the order to update
   * @param status - New status
   */
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status
        })
      });

      if (response.ok) {
        // Update local state
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: status as 'PENDING' | 'COMPLETED' | 'CANCELLED' } : order
    ));
        console.log(`Successfully updated order ${orderId} status to ${status}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update order status:', errorData.error);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  /**
   * Updates payment status
   * @param orderId - ID of the order to update
   * @param paymentStatus - New payment status
   */
  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus
        })
      });

      if (response.ok) {
        // Update local state
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, paymentStatus: paymentStatus as 'PENDING' | 'PAID' | 'VERIFIED' } : order
    ));
        console.log(`Successfully updated order ${orderId} payment status to ${paymentStatus}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update payment status:', errorData.error);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  /**
   * Deletes files for an order
   * @param orderId - ID of the order
   */
  const deleteFiles = async (orderId: string) => {
    try {
      // Get the order to find its files
      const order = orders.find(o => o.id === orderId);
      if (!order || !order.files || order.files.length === 0) {
        console.log('No files to delete for order', orderId);
        return;
      }

      // Delete each file
      const deletePromises = order.files.map(fileName => 
        fetch(`/api/orders/${orderId}/files/${fileName}`, {
          method: 'DELETE'
        })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.ok).length;

      if (successCount > 0) {
        // Update local state
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, files: [] } : order
    ));
        console.log(`Successfully deleted ${successCount} files for order ${orderId}`);
      } else {
        console.error('Failed to delete files for order', orderId);
      }
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };

  /**
   * Verifies a single user
   * @param userId - ID of the user to verify
   */
  const verifyUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [userId],
          isVerified: true
        })
      });

      if (response.ok) {
        // Update local state
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isVerified: true } : user
    ));
        console.log(`Successfully verified user ${userId}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to verify user:', errorData.error);
      }
    } catch (error) {
      console.error('Error verifying user:', error);
    }
  };

  /**
   * Verifies multiple users in bulk
   * @param userIds - Array of user IDs to verify
   */
  const bulkVerifyUsers = async (userIds: string[]) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          isVerified: true
        })
      });

      if (response.ok) {
        // Update local state
    setUsers(prev => prev.map(user => 
      userIds.includes(user.id) ? { ...user, isVerified: true } : user
    ));
        console.log(`Successfully bulk verified users: ${userIds.join(', ')}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to bulk verify users:', errorData.error);
      }
    } catch (error) {
      console.error('Error bulk verifying users:', error);
    }
  };

  /**
   * Views order details
   * @param orderId - ID of the order to view
   */
  const viewOrder = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };

  /**
   * Downloads order files
   * @param orderId - ID of the order to download files from
   */
  const downloadFiles = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.files.length > 0) {
      // For now, just show an alert with file information
      // In the future, this could trigger actual file downloads
      alert(`Files for Order ${orderId}:\n${order.files.join('\n')}`);
    } else {
      alert('No files found for this order');
    }
  };

  /**
   * Handles admin logout
   */
  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch('/api/admin/session', {
        method: 'DELETE'
      });
      
      // Redirect to login
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect anyway
      window.location.href = '/admin/login';
    }
  };

  /**
   * Exports dashboard data as CSV
   */
  const exportData = () => {
    try {
      // Export orders as CSV
      const csvHeaders = ['Order ID', 'Name', 'Phone', 'Pages', 'Copies', 'Total Amount', 'Status', 'Payment Status', 'Created At'];
      const csvRows = orders.map(order => [
        order.id,
        order.name,
        order.phone,
        order.pages,
        order.copies,
        order.totalAmount,
        order.status,
        order.paymentStatus,
        order.createdAt.toISOString()
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  /**
   * Opens settings modal
   */
  const handleSettings = () => {
    setShowSettings(true);
  };

  /**
   * Closes settings modal
   */
  const closeSettings = () => {
    setShowSettings(false);
  };

  /**
   * Saves settings configuration
   */
  const saveSettings = async () => {
    // TODO: Implement settings save API endpoint
    alert('Settings saved successfully! (Note: Full implementation requires API endpoint)');
    setShowSettings(false);
  };

  /**
   * Updates a setting value
   */
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage orders, users, and system settings</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={loadDashboardData}
                disabled={isLoading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={exportData}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={handleSettings}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="mb-8">
          <AdminStats stats={stats} isLoading={isLoading} />
        </div>

        {/* Orders Management */}
        <div className="mb-8">
          <OrderTable
            orders={orders}
            onUpdateOrderStatus={updateOrderStatus}
            onUpdatePaymentStatus={updatePaymentStatus}
            onDeleteFiles={deleteFiles}
            onViewOrder={viewOrder}
            onDownloadFiles={downloadFiles}
            isLoading={isLoading}
          />
        </div>

        {/* User Verification Queue */}
        <VerificationQueue
          users={users}
          onVerifyUser={verifyUser}
          onBulkVerify={bulkVerifyUsers}
          isLoading={isLoading}
        />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <button
                  onClick={closeSettings}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Settings Form */}
              <div className="space-y-6">
                {/* Admin Passcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Passcode
                  </label>
                  <input
                    type="password"
                    value={settings.adminPasscode}
                    onChange={(e) => updateSetting('adminPasscode', e.target.value)}
                    placeholder="Enter new passcode (leave empty to keep current)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Keep it secure and confidential</p>
                </div>

                {/* Max File Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum file size for uploads (1-100 MB)</p>
                </div>

                {/* Upload Timeout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.uploadTimeout}
                    onChange={(e) => updateSetting('uploadTimeout', parseInt(e.target.value))}
                    min="30"
                    max="300"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Timeout for file uploads (30-300 seconds)</p>
                </div>

                {/* Enable Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enable Notifications
                    </label>
                    <p className="text-xs text-gray-500">Receive notifications for new orders and events</p>
                  </div>
                  <button
                    onClick={() => updateSetting('enableNotifications', !settings.enableNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enableNotifications ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto Verify Users */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto Verify Users
                    </label>
                    <p className="text-xs text-gray-500">Automatically verify new user registrations</p>
                  </div>
                  <button
                    onClick={() => updateSetting('autoVerifyUsers', !settings.autoVerifyUsers)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.autoVerifyUsers ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.autoVerifyUsers ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8">
                <Button
                  variant="outline"
                  onClick={closeSettings}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveSettings}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
