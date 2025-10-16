/**
 * @file src/components/user/TrackOrder.tsx
 * @description Component for users to track their existing orders.
 */
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Simulated order data type. This should match your Prisma schema.
type Order = {
    id: string;
    name: string;
    totalAmount: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID' | 'VERIFIED';
    files: string[];
    createdAt: Date;
};

const TrackOrder = () => {
  const [phone, setPhone] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTrack = async () => {
    if (!phone.trim() || !tokenId.trim()) {
      alert('Please enter both phone number and token ID');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/orders?phone=${phone}&tokenId=${tokenId}&page=1`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert(error instanceof Error ? error.message : 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-gray-900">Find Your Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="w-full space-y-2">
            <Label htmlFor="track-phone" className="text-gray-700 font-medium">Mobile Number *</Label>
            <Input 
              id="track-phone" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="Enter your mobile number" 
              className="border-gray-300 focus:border-gray-500"
            />
          </div>
          <div className="w-full space-y-2">
            <Label htmlFor="track-token" className="text-gray-700 font-medium">Your Token ID *</Label>
            <Input 
              id="track-token" 
              value={tokenId} 
              onChange={(e) => setTokenId(e.target.value)} 
              placeholder="Enter your Token ID" 
              className="border-gray-300 focus:border-gray-500"
            />
          </div>
          <Button 
            onClick={handleTrack} 
            disabled={isLoading} 
            className="self-end bg-gray-800 hover:bg-gray-900 text-white"
          >
            {isLoading ? 'Searching...' : 'Track Orders'}
          </Button>
        </CardContent>
      </Card>

      {/* Display Orders */}
      <div className="mt-8 space-y-4">
        {orders.length === 0 && !isLoading && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No orders found. Please check your credentials.</p>
            </CardContent>
          </Card>
        )}
        
        {orders.map(order => (
          <Card key={order.id} className="bg-white border-gray-200 shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Order ID: {order.id}</CardTitle>
                <p className="text-sm text-gray-600">Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <Button 
                variant="destructive" 
                disabled={order.status !== 'PENDING'}
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel Order
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Name:</strong> {order.name}</p>
              <p><strong>Total Amount:</strong> ₹{order.totalAmount}</p>
              <p><strong>Order Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
              </p>
              <p><strong>Payment Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  order.paymentStatus === 'PAID' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {order.paymentStatus}
                </span>
              </p>
              <p><strong>Files:</strong> {Array.isArray(order.files) ? order.files.length : 0} file(s)</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrackOrder;
