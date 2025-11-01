/**
 * @file src/components/user/TrackOrder.tsx
 * @description Component for users to track their existing orders.
 */
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showError, showLoading, updateToSuccess, updateToError } from "@/lib/toast";
import { handleApiError, handleNetworkError, redirectToHomeAfterDelay } from "@/lib/apiErrorHandler";
import { MessageCircle, Phone, X } from "lucide-react";

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAdminContactModal, setShowAdminContactModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showCancelModal || showAdminContactModal) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [showCancelModal, showAdminContactModal]);
  
  const handleTrack = async () => {
    if (!phone.trim() || !tokenId.trim()) {
      showError('Please enter both phone number and token ID');
      return;
    }

    setIsLoading(true);
    const loadingToast = showLoading("Searching for orders...", "Please wait while we fetch your orders");
    
    try {
      const response = await fetch(`/api/orders?phone=${phone}&tokenId=${tokenId}&page=1`);
      
      if (!response.ok) {
        const errorData = await handleApiError(response, 'Failed to fetch orders');
        
        if (errorData) {
          const suggestion = errorData.suggestion ? `\n\n${errorData.suggestion}` : '';
          updateToError(loadingToast, errorData.error, suggestion);
          
          // Redirect to home if server error
          if (errorData.shouldRedirect) {
            redirectToHomeAfterDelay(errorData.error, errorData.suggestion);
          }
        }
        
        setOrders([]);
        return;
      }

      const data = await response.json();
      setOrders(data.orders || []);
      
      if (data.orders && data.orders.length > 0) {
        updateToSuccess(loadingToast, `Found ${data.orders.length} order(s)`, "Your orders are displayed below");
      } else {
        updateToSuccess(loadingToast, "No orders found", "Please check your phone number and Token ID");
      }
    } catch (error) {
      // Network errors or unexpected errors
      const networkError = handleNetworkError(error, 'Failed to fetch orders');
      updateToError(loadingToast, networkError.error, networkError.suggestion);
      setOrders([]);
      
      // Network errors - redirect to home after delay
      redirectToHomeAfterDelay(networkError.error, networkError.suggestion);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles cancel order button click
   * @param order - The order to cancel
   */
  const handleCancelClick = (order: Order) => {
    // Check if payment is PAID or VERIFIED - show admin contact modal
    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'VERIFIED') {
      setOrderToCancel(order);
      setShowAdminContactModal(true);
      return;
    }

    // For pending payments, show confirmation modal
    setOrderToCancel(order);
    setCancelOrderId(order.id);
    setShowCancelModal(true);
  };

  /**
   * Confirms and cancels the order
   */
  const confirmCancelOrder = async () => {
    if (!cancelOrderId || !orderToCancel) return;

    setIsCancelling(true);
    const loadingToast = showLoading("Cancelling order...", "Please wait");

    try {
      const response = await fetch(`/api/orders/${cancelOrderId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await handleApiError(response, 'Failed to cancel order');
        
        if (errorData) {
          const suggestion = errorData.suggestion ? `\n\n${errorData.suggestion}` : '';
          updateToError(loadingToast, errorData.error, suggestion);
          
          // Redirect to home if server error
          if (errorData.shouldRedirect) {
            redirectToHomeAfterDelay(errorData.error, errorData.suggestion);
          }
        }
        
        setShowCancelModal(false);
        setCancelOrderId(null);
        setOrderToCancel(null);
        return;
      }

      await response.json();
      
      updateToSuccess(loadingToast, "Order cancelled successfully!", "The order has been cancelled");
      
      // Close modal and refresh orders
      setShowCancelModal(false);
      setCancelOrderId(null);
      setOrderToCancel(null);
      
      // Refresh orders list
      await handleTrack();
      
    } catch (error) {
      console.error('Error cancelling order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
      updateToError(loadingToast, errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Gets admin WhatsApp number from environment or defaults
   */
  const getAdminWhatsApp = () => {
    return process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "919412010234";
  };

  /**
   * Gets admin phone number from environment or defaults
   */
  const getAdminPhone = () => {
    return process.env.NEXT_PUBLIC_ADMIN_PHONE || "9412010234";
  };

  /**
   * Opens WhatsApp to contact admin
   */
  const openWhatsApp = () => {
    const adminWhatsApp = getAdminWhatsApp();
    const message = `Hello, I need to cancel my order. Order ID: ${orderToCancel?.id}`;
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  /**
   * Calls admin phone number
   */
  const callAdmin = () => {
    const adminPhone = getAdminPhone();
    window.location.href = `tel:${adminPhone}`;
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
                disabled={order.status !== 'PENDING' || isCancelling}
                onClick={() => handleCancelClick(order)}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCancelling && cancelOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
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

      {/* Cancel Confirmation Modal */}
      {showCancelModal && orderToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">Confirm Cancellation</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelOrderId(null);
                  setOrderToCancel(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                disabled={isCancelling}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Are you sure you want to cancel this order? This action cannot be undone.
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-700"><strong>Order ID:</strong> {orderToCancel.id}</p>
                <p className="text-gray-700"><strong>Amount:</strong> ₹{orderToCancel.totalAmount}</p>
                <p className="text-gray-700"><strong>Status:</strong> {orderToCancel.status}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelOrderId(null);
                    setOrderToCancel(null);
                  }}
                  variant="outline"
                  disabled={isCancelling}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  No, Keep Order
                </Button>
                <Button
                  onClick={confirmCancelOrder}
                  disabled={isCancelling}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isCancelling ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cancelling...
                    </div>
                  ) : (
                    'Yes, Cancel Order'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Contact Modal - For Paid Orders */}
      {showAdminContactModal && orderToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">Contact Admin</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAdminContactModal(false);
                  setOrderToCancel(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Notice:</strong> This order has a payment status of <strong>{orderToCancel.paymentStatus}</strong>. 
                  To cancel this order, please contact the admin directly as payment has already been processed.
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-700"><strong>Order ID:</strong> {orderToCancel.id}</p>
                <p className="text-gray-700"><strong>Amount:</strong> ₹{orderToCancel.totalAmount}</p>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={openWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact via WhatsApp
                </Button>
                
                <Button
                  onClick={callAdmin}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Admin: {getAdminPhone()}
                </Button>

                <Button
                  onClick={() => {
                    setShowAdminContactModal(false);
                    setOrderToCancel(null);
                  }}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
