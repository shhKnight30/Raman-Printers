/**
 * @file src/app/admin/dashboard/page.tsx
 * @description Enhanced admin dashboard with comprehensive order and user management.
 * Features statistics, advanced search, pagination, and bulk operations.
 */
"use client";
import { useState, useEffect } from "react";
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
    
    // TODO: Replace with actual API calls
    setTimeout(() => {
      const mockOrders: Order[] = [
        {
          id: 'ORD-001',
          name: 'Maths Notes - Chapter 1',
          phone: '9876543210',
          pages: 25,
          tokenId: 'TK-12345',
          copies: 2,
          notes: 'Black & White, single-sided',
          totalAmount: 100,
          status: 'PENDING',
          paymentStatus: 'PAID',
          files: ['maths_chapter1.pdf'],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: { phone: '9876543210', tokenId: 'TK-12345', isVerified: true }
        },
        {
          id: 'ORD-002',
          name: 'Project Report',
          phone: '9876543211',
          pages: 50,
          tokenId: 'TK-12346',
          copies: 1,
          notes: 'Color print, spiral binding',
          totalAmount: 150,
          status: 'COMPLETED',
          paymentStatus: 'VERIFIED',
          files: ['project_report.pdf', 'appendix.pdf'],
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          user: { phone: '9876543211', tokenId: 'TK-12346', isVerified: true }
        },
        {
          id: 'ORD-003',
          name: 'Assignment Solutions',
          phone: '9876543212',
          pages: 15,
          tokenId: 'TK-12347',
          copies: 3,
          notes: 'Urgent delivery',
          totalAmount: 90,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          files: ['assignment.pdf'],
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          user: { phone: '9876543212', tokenId: 'TK-12347', isVerified: false }
        },
        {
          id: 'ORD-004',
          name: 'Study Material',
          phone: '9876543210',
          pages: 100,
          tokenId: 'TK-12345',
          copies: 1,
          totalAmount: 200,
          status: 'CANCELLED',
          paymentStatus: 'PENDING',
          files: ['study_material.pdf'],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          user: { phone: '9876543210', tokenId: 'TK-12345', isVerified: true }
        }
      ];

      const mockUsers: User[] = [
        {
          id: 'user1',
          phone: '9876543210',
          tokenId: 'TK-12345',
          isVerified: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          orders: [
            { id: 'ORD-001', name: 'Maths Notes', status: 'PENDING', totalAmount: 100 },
            { id: 'ORD-004', name: 'Study Material', status: 'CANCELLED', totalAmount: 200 }
          ]
        },
        {
          id: 'user2',
          phone: '9876543211',
          tokenId: 'TK-12346',
          isVerified: true,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          orders: [
            { id: 'ORD-002', name: 'Project Report', status: 'COMPLETED', totalAmount: 150 }
          ]
        },
        {
          id: 'user3',
          phone: '9876543212',
          tokenId: 'TK-12347',
          isVerified: false,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          orders: [
            { id: 'ORD-003', name: 'Assignment Solutions', status: 'PENDING', totalAmount: 90 }
          ]
        },
        {
          id: 'user4',
          phone: '9876543213',
          tokenId: 'TK-12348',
          isVerified: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          orders: []
        }
      ];

      // Calculate statistics
      const totalOrders = mockOrders.length;
      const pendingOrders = mockOrders.filter(o => o.status === 'PENDING').length;
      const completedOrders = mockOrders.filter(o => o.status === 'COMPLETED').length;
      const cancelledOrders = mockOrders.filter(o => o.status === 'CANCELLED').length;
      const totalRevenue = mockOrders
        .filter(o => o.status === 'COMPLETED' && o.paymentStatus === 'VERIFIED')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      const pendingRevenue = mockOrders
        .filter(o => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      const verifiedUsers = mockUsers.filter(u => u.isVerified).length;
      const pendingVerifications = mockUsers.filter(u => !u.isVerified).length;
      const recentOrders = mockOrders.filter(o => 
        Date.now() - o.createdAt.getTime() < 24 * 60 * 60 * 1000
      ).length;

      setOrders(mockOrders);
      setUsers(mockUsers);
      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        pendingRevenue,
        verifiedUsers,
        pendingVerifications,
        recentOrders,
      });
      setIsLoading(false);
    }, 1500);
  };

  /**
   * Updates order status
   * @param orderId - ID of the order to update
   * @param status - New status
   */
  const updateOrderStatus = (orderId: string, status: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: status as 'PENDING' | 'COMPLETED' | 'CANCELLED' } : order
    ));
    // TODO: Implement API call
    console.log(`Updated order ${orderId} status to ${status}`);
  };

  /**
   * Updates payment status
   * @param orderId - ID of the order to update
   * @param paymentStatus - New payment status
   */
  const updatePaymentStatus = (orderId: string, paymentStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, paymentStatus: paymentStatus as 'PENDING' | 'PAID' | 'VERIFIED' } : order
    ));
    // TODO: Implement API call
    console.log(`Updated order ${orderId} payment status to ${paymentStatus}`);
  };

  /**
   * Deletes files for an order
   * @param orderId - ID of the order
   */
  const deleteFiles = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, files: [] } : order
    ));
    // TODO: Implement API call
    console.log(`Deleted files for order ${orderId}`);
  };

  /**
   * Verifies a single user
   * @param userId - ID of the user to verify
   */
  const verifyUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isVerified: true } : user
    ));
    // TODO: Implement API call
    console.log(`Verified user ${userId}`);
  };

  /**
   * Verifies multiple users in bulk
   * @param userIds - Array of user IDs to verify
   */
  const bulkVerifyUsers = (userIds: string[]) => {
    setUsers(prev => prev.map(user => 
      userIds.includes(user.id) ? { ...user, isVerified: true } : user
    ));
    // TODO: Implement API call
    console.log(`Bulk verified users: ${userIds.join(', ')}`);
  };

  /**
   * Handles admin logout
   */
  const handleLogout = () => {
    // TODO: Implement logout logic
    window.location.href = '/admin/login';
  };

  /**
   * Exports dashboard data
   */
  const exportData = () => {
    // TODO: Implement data export
    console.log('Exporting dashboard data...');
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
    </div>
  );
};

export default AdminDashboard;
