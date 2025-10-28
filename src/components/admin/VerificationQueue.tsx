/**
 * @file src/components/admin/VerificationQueue.tsx
 * @description User verification queue component for admin dashboard.
 * Manages pending user verifications with search and batch operations.
 */
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckCircle, MessageCircle, Phone, Calendar } from "lucide-react";

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
 * Props interface for VerificationQueue component
 */
interface VerificationQueueProps {
  users: User[];
  onVerifyUser: (userId: string) => void;
  onBulkVerify: (userIds: string[]) => void;
  isLoading?: boolean;
}

/**
 * VerificationQueue component for managing user verifications
 * @param users - Array of users to display
 * @param onVerifyUser - Callback for verifying a single user
 * @param onBulkVerify - Callback for bulk verification
 * @param isLoading - Loading state indicator
 * @returns JSX element for verification queue
 */
const VerificationQueue: React.FC<VerificationQueueProps> = ({
  users,
  onVerifyUser,
  onBulkVerify,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  /**
   * Filters users based on search query
   */
  const filteredUsers = users.filter(user =>
    user.phone.includes(searchQuery) ||
    user.tokenId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Handles individual user selection
   */
  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  /**
   * Handles select all functionality
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  /**
   * Handles bulk verification
   */
  const handleBulkVerify = () => {
    if (selectedUsers.length > 0) {
      onBulkVerify(selectedUsers);
      setSelectedUsers([]);
    }
  };

  /**
   * Generates WhatsApp verification URL
   */
  const generateWhatsAppURL = (phone: string, tokenId: string) => {
    const message = `verified #${tokenId}`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  /**
   * Opens WhatsApp verification
   */
  const openWhatsAppVerification = (phone: string, tokenId: string) => {
    window.open(generateWhatsAppURL(phone, tokenId), '_blank');
  };

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle className="text-xl font-bold text-gray-900">
            User Verification Queue ({filteredUsers.length})
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by phone or token ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500"
              />
            </div>
            
            {selectedUsers.length > 0 && (
              <Button
                onClick={handleBulkVerify}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Selected ({selectedUsers.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading users...</div>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-gray-700 font-semibold">Phone</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Token ID</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Orders</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Created</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleUserSelect(user.id, Boolean(checked))}
                        />
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{user.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 font-mono text-sm">
                        {user.tokenId}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={user.isVerified 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {user.isVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <div className="space-y-1">
                          {user.orders.length > 0 ? (
                            user.orders.map((order) => (
                              <div key={order.id} className="text-sm">
                                <div className="font-medium">{order.name}</div>
                                <div className="text-gray-500">
                                  ₹{order.totalAmount.toFixed(2)} • {order.status}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No orders</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openWhatsAppVerification(user.phone, user.tokenId)}
                            className="border-green-600 text-green-600 hover:bg-green-50"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            WhatsApp
                          </Button>
                          {!user.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onVerifyUser(user.id)}
                              className="border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No pending verifications found.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationQueue;

