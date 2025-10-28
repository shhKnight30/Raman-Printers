/**
 * @file src/components/admin/OrderTable.tsx
 * @description Comprehensive order management table for admin dashboard.
 * Features pagination, search, filtering, and order status management.
 */
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, Filter, Eye, Download, Trash2 } from "lucide-react";

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
 * Props interface for OrderTable component
 */
interface OrderTableProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  onUpdatePaymentStatus: (orderId: string, paymentStatus: string) => void;
  onDeleteFiles: (orderId: string) => void;
  onViewOrder?: (orderId: string) => void;
  onDownloadFiles?: (orderId: string) => void;
  isLoading?: boolean;
}

/**
 * OrderTable component with advanced features
 * @param orders - Array of orders to display
 * @param onUpdateOrderStatus - Callback for updating order status
 * @param onUpdatePaymentStatus - Callback for updating payment status
 * @param onDeleteFiles - Callback for deleting order files
 * @param isLoading - Loading state indicator
 * @returns JSX element for order table
 */
const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onDeleteFiles,
  onViewOrder,
  onDownloadFiles,
  isLoading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  
  const ITEMS_PER_PAGE = 10;

  /**
   * Filters orders based on search query and filters
   */
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  /**
   * Calculates pagination
   */
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);


  /**
   * Handles page navigation
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Resets filters and search
   */
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setCurrentPage(1);
  };

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle className="text-xl font-bold text-gray-900">
            Orders Management ({filteredOrders.length})
          </CardTitle>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-40 border-gray-300">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={resetFilters}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading orders...</div>
          </div>
        ) : (
          <>
            {/* Orders Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-gray-700 font-semibold">Order ID</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Customer</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Phone</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Amount</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Payment</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Date</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {order.id}
                      </TableCell>
                      <TableCell className="text-gray-700">{order.name}</TableCell>
                      <TableCell className="text-gray-700">{order.phone}</TableCell>
                      <TableCell className="text-gray-700 font-semibold">
                        ₹{order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => onUpdateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32 border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.paymentStatus}
                          onValueChange={(value) => onUpdatePaymentStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32 border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="VERIFIED">Verified</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewOrder?.(order.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownloadFiles?.(order.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {order.status === 'COMPLETED' && order.paymentStatus === 'VERIFIED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteFiles(order.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={currentPage === pageNum 
                            ? "bg-blue-600 hover:bg-blue-700" 
                            : "border-gray-300"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-gray-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {paginatedOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No orders found matching your criteria.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTable;
