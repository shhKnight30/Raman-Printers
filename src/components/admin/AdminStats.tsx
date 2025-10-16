/**
 * @file src/components/admin/AdminStats.tsx
 * @description Admin dashboard statistics component showing key metrics.
 * Displays order counts, revenue, and user statistics.
 */
"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle 
} from "lucide-react";

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
 * Props interface for AdminStats component
 */
interface AdminStatsProps {
  stats: AdminStatsData;
  isLoading?: boolean;
}

/**
 * AdminStats component displays key dashboard metrics
 * @param stats - Statistics data to display
 * @param isLoading - Loading state indicator
 * @returns JSX element for admin statistics
 */
const AdminStats: React.FC<AdminStatsProps> = ({ stats, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="bg-white border-gray-200 shadow-lg">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: stats.recentOrders,
      changeLabel: "Recent",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      badge: "Attention",
      badgeColor: "bg-yellow-100 text-yellow-800",
    },
    {
      title: "Completed Orders",
      value: stats.completedOrders,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      percentage: stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0,
    },
    {
      title: "Cancelled Orders",
      value: stats.cancelledOrders,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      percentage: stats.totalOrders > 0 ? Math.round((stats.cancelledOrders / stats.totalOrders) * 100) : 0,
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: `₹${stats.pendingRevenue.toFixed(2)}`,
      changeLabel: "Pending",
    },
    {
      title: "Verified Users",
      value: stats.verifiedUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      percentage: stats.verifiedUsers + stats.pendingVerifications > 0 
        ? Math.round((stats.verifiedUsers / (stats.verifiedUsers + stats.pendingVerifications)) * 100) 
        : 0,
    },
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      badge: stats.pendingVerifications > 0 ? "Action Required" : "All Clear",
      badgeColor: stats.pendingVerifications > 0 
        ? "bg-orange-100 text-orange-800" 
        : "bg-green-100 text-green-800",
    },
    {
      title: "Recent Orders (24h)",
      value: stats.recentOrders,
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: stats.recentOrders > 0 ? "+" : "",
      changeLabel: "Today",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-white border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.changeLabel}: {stat.change}
                    </p>
                  )}
                  {stat.percentage !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.percentage}% of total
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              {stat.badge && (
                <div className="mt-3">
                  <Badge className={stat.badgeColor}>
                    {stat.badge}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminStats;
