/**
 * @file src/app/payment/page.tsx
 * @description Modern payment page with order summary, file preview, and payment options
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Trash2, QrCode, CreditCard, CheckCircle, Copy, MessageCircle } from "lucide-react";
import { showError, showSuccess, showLoading, updateToSuccess, updateToError, ToastMessages } from "@/lib/toast";

interface OrderData {
  name: string;
  phone: string;
  copies: number;
  pages: number;
  notes: string;
  files: FileDescriptor[]; // Pre-uploaded file descriptors
  isNewUser: boolean;
  tokenId: string;
}

interface FileDescriptor {
  name: string;
  path: string;
  size: number;
  type: string;
  pages: number;
}

const PRICE_PER_PAGE = 5; // ₹5 per page

export default function PaymentPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileDescriptor[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPayNow, setShowPayNow] = useState(false);
  const [showPayLater, setShowPayLater] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTokenVerification, setShowTokenVerification] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [userTokenId, setUserTokenId] = useState<string | null>(null);

  // Load order data from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('orderData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setOrderData(data);
      setUploadedFiles(data.files || []); // Files are already uploaded
      setTotalPages(data.pages);
      setTotalAmount(data.pages * data.copies * PRICE_PER_PAGE);
    } else {
      // Redirect back to home if no order data
      router.push('/');
    }
  }, [router]);

  // Lock body scroll when modals are open
  useEffect(() => {
    const anyModalOpen = showPayNow || showPayLater || showTokenVerification || showSuccess;
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [showPayNow, showPayLater, showTokenVerification, showSuccess]);


  /**
   * Handles file preview (opens in new tab)
   */
  const handleFilePreview = (filePath: string) => {
    window.open(filePath, '_blank');
  };

  /**
   * Removes a file from the order (local only for now)
   */
  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    
    // Recalculate total pages if files were removed
    const newTotalPages = newFiles.reduce((sum, file) => sum + file.pages, 0);
    setTotalPages(newTotalPages);
    setTotalAmount(newTotalPages * orderData!.copies * PRICE_PER_PAGE);
  };

  /**
   * Handles manual page count update
   */
  const handlePagesChange = (pages: number) => {
    setTotalPages(Math.max(1, pages));
    setTotalAmount(pages * orderData!.copies * PRICE_PER_PAGE);
  };

  /**
   * Handles Pay Now flow
   */
  const handlePayNow = () => {
    setShowPayNow(true);
  };

  /**
   * Handles Pay Later flow
   */
  const handlePayLater = () => {
    setShowPayLater(true);
  };

  /**
   * Confirms payment and creates order
   */
  const confirmPayment = async (paymentType: 'pay-now' | 'pay-later') => {
    if (!orderData) return;

    setIsLoading(true);
    try {
      const orderPayload = {
        name: orderData.name,
        phone: orderData.phone,
        copies: orderData.copies,
        notes: orderData.notes,
        pages: totalPages,
        files: uploadedFiles,
        isNewUser: orderData.isNewUser,
        tokenId: orderData.tokenId
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Order creation failed');
      }

      const result = await response.json();
      setOrderId(result.orderId);
      setUserTokenId(result.tokenId);
      
      // Show token verification for NEW users only
      if (result.isNewUser) {
        setShowTokenVerification(true);
      } else {
        setShowSuccess(true);
      }
      
      // Clear localStorage
      localStorage.removeItem('orderData');
      
      // Close payment modals
      setShowPayNow(false);
      setShowPayLater(false);

    } catch (error) {
      console.error('Order creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Order creation failed';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles success completion
   */
  const handleSuccessComplete = () => {
    if (orderData?.isNewUser) {
      // Show verification modal for new users
      // This will be handled by the parent component
      router.push('/?showVerification=true&tokenId=' + orderData.tokenId);
    } else {
      // Redirect to home for existing users
      router.push('/');
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Order Data Found</h2>
          <p className="text-gray-600 mb-6">Please go back and place an order first.</p>
          <Button onClick={() => router.push('/')} className="bg-gray-800 hover:bg-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Complete Your Order</h1>
                <p className="text-gray-600">Review your order and choose payment method</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Customer Name</Label>
                    <p className="text-lg font-semibold text-gray-900">{orderData.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                    <p className="text-lg font-semibold text-gray-900">{orderData.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Number of Copies</Label>
                    <p className="text-lg font-semibold text-gray-900">{orderData.copies}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">User Type</Label>
                    <Badge className={orderData.isNewUser ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                      {orderData.isNewUser ? "New User" : "Returning User"}
                    </Badge>
                  </div>
                </div>
                
                {orderData.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Special Instructions</Label>
                    <p className="text-gray-900 mt-1">{orderData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Files Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Uploaded Files</CardTitle>
                <p className="text-sm text-gray-600">Click on file names to preview them</p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Uploading files...</p>
                  </div>
                ) : uploadedFiles.length > 0 ? (
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleFilePreview(file.path)}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>{file.name}</span>
                          </button>
                          <Badge variant="outline" className="text-xs">
                            {file.pages} page{file.pages !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No files uploaded</p>
                )}
              </CardContent>
            </Card>

            {/* Pages Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Total Pages</CardTitle>
                <p className="text-sm text-gray-600">Enter the total number of pages for your order</p>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs">
                  <Label htmlFor="pages" className="text-sm font-medium text-gray-700">
                    Number of Pages *
                  </Label>
                  <Input
                    id="pages"
                    type="number"
                    value={totalPages}
                    onChange={(e) => handlePagesChange(parseInt(e.target.value) || 1)}
                    min="1"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pages</span>
                    <span className="font-medium">{totalPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Copies</span>
                    <span className="font-medium">{orderData.copies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per page</span>
                    <span className="font-medium">₹{PRICE_PER_PAGE}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount</span>
                    <span className="text-gray-900">₹{totalAmount}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handlePayNow}
                    disabled={isLoading || uploadedFiles.length === 0}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Pay Now (₹{totalAmount})
                  </Button>
                  
                  <Button
                    onClick={handlePayLater}
                    disabled={isLoading || uploadedFiles.length === 0}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pay Now Modal */}
      {showPayNow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md max-h-screen overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle className="text-center">Complete Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="w-72 h-72 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center mb-6 shadow-inner">
                  <div className="text-center p-4">
                    <div className="w-32 h-32 mx-auto bg-white rounded-lg shadow-lg flex items-center justify-center mb-4">
                      <QrCode className="h-16 w-16 text-blue-500" />
                    </div>
                    <p className="text-base font-medium text-gray-700 mb-1">UPI QR Code</p>
                    <p className="text-xs text-gray-500">Scan with any UPI app</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Payment Amount: <span className="text-lg font-bold">₹{totalAmount}</span>
                  </p>
                  <p className="text-xs text-blue-700">
                    Scan the QR code with your UPI app to complete payment
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => confirmPayment('pay-now')}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 transition-colors duration-200 font-medium py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Payment Complete'
                  )}
                </Button>
                <Button
                  onClick={() => setShowPayNow(false)}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 py-3"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pay Later Modal */}
      {showPayLater && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md max-h-screen overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle className="text-center">Confirm Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to place this order for ₹{totalAmount}?
                </p>
                <p className="text-sm text-gray-500">
                  You can pay later when you collect your order.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => confirmPayment('pay-later')}
                  disabled={isLoading}
                  className="w-full bg-gray-800 hover:bg-gray-900 transition-colors duration-200 font-medium py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Place Order'
                  )}
                </Button>
                <Button
                  onClick={() => setShowPayLater(false)}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 py-3"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Token Verification Modal - Only for NEW users */}
      {showTokenVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg max-h-screen overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle className="text-center text-blue-600">Account Verification Required</CardTitle>
              <p className="text-center text-gray-600 text-sm">
                As a new user, you need to verify your account to complete your order
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Success Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Order Placed Successfully!</span>
                </div>
                <p className="text-sm text-green-700">
                  Order ID: <span className="font-mono font-bold">{orderId}</span>
                </p>
              </div>

              {/* Token ID Display */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Your Verification Token ID:
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={userTokenId || ''}
                    readOnly
                    className="font-mono text-lg font-bold bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(userTokenId || '');
                      showSuccess('Token ID copied to clipboard!');
                    }}
                    className="border-gray-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Copy this token ID - you'll need it for verification
                </p>
              </div>

              {/* Verification Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Verification Steps:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Click the WhatsApp button below</li>
                  <li>2. Send the verification message with your token ID</li>
                  <li>3. Wait for admin to verify your account</li>
                  <li>4. Your order will be processed once verified</li>
                </ol>
              </div>

              {/* WhatsApp Button */}
              <Button
                onClick={() => {
                  const adminWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "919412010234";
                  const message = `verify #${userTokenId}`;
                  const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Open WhatsApp for Verification
              </Button>

              {/* Continue Button */}
              <Button
                onClick={() => {
                  setShowTokenVerification(false);
                  router.push('/');
                }}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                I've Sent the Verification Message
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Modal - Only for existing users */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-md max-h-screen overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            <CardHeader>
              <CardTitle className="text-center text-green-600">Order Placed Successfully!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Your order has been placed successfully!
                </p>
                <p className="text-sm text-gray-500">
                  Order ID: {orderId}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  You can track your order using your phone number and token ID.
                </p>
              </div>

              <Button
                onClick={handleSuccessComplete}
                className="w-full bg-gray-800 hover:bg-gray-900"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
