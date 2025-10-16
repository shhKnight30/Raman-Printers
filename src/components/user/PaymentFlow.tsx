/**
 * @file src/components/user/PaymentFlow.tsx
 * @description Payment flow component with QR code display and verification options.
 * Handles both "Pay Later" and "Pay Now" scenarios with proper user guidance.
 */
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

/**
 * Props interface for PaymentFlow component
 */
interface PaymentFlowProps {
  orderDetails: {
    name: string;
    totalAmount: number;
    files: File[];
  };
  onBack: () => void;
  onPaymentComplete: () => void;
  onPaymentLater: () => void;
  onClose: () => void;
}

/**
 * PaymentFlow component handles the payment process
 * @param orderDetails - Order information including name, amount, and files
 * @param onBack - Callback to go back to previous step
 * @param onPaymentComplete - Callback when payment is completed
 * @param onPaymentLater - Callback when user chooses to pay later
 * @param onClose - Callback to close the payment flow
 * @returns JSX element for payment flow
 */
const PaymentFlow: React.FC<PaymentFlowProps> = ({
  orderDetails,
  onBack: _onBack, // eslint-disable-line @typescript-eslint/no-unused-vars
  onPaymentComplete,
  onPaymentLater,
  onClose,
}) => {
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'qr' | 'complete'>('confirm');
  const [selectedFiles, setSelectedFiles] = useState<File[]>(orderDetails.files);

  /**
   * Removes a file from the selected files list
   * @param index - Index of the file to remove
   */
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Handles payment confirmation and proceeds to QR display
   */
  const handlePaymentConfirm = () => {
    setPaymentStep('qr');
  };

  /**
   * Handles payment completion
   */
  const handlePaymentComplete = () => {
    setPaymentStep('complete');
    setTimeout(() => {
      onPaymentComplete();
    }, 2000);
  };

  /**
   * Handles rollback to previous step
   */
  const handleRollback = () => {
    setPaymentStep('confirm');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-white border-gray-200 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Payment Process
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Any mischievous activity will not be tolerated. 
                Please ensure you have uploaded the correct files and provided accurate information.
              </p>
            </div>
          </div>

          {paymentStep === 'confirm' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Confirm Your Order</h3>
              
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                <p><strong>Name:</strong> {orderDetails.name}</p>
                <p><strong>Total Amount:</strong> ₹{orderDetails.totalAmount.toFixed(2)}</p>
                <p><strong>Files ({selectedFiles.length}):</strong></p>
                <div className="mt-2 space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded p-2">
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handlePaymentConfirm}
                  disabled={selectedFiles.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Pay Now (₹{orderDetails.totalAmount.toFixed(2)})
                </Button>
                <Button
                  variant="outline"
                  onClick={onPaymentLater}
                  className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Pay Later
                </Button>
              </div>
            </div>
          )}

          {paymentStep === 'qr' && (
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">Complete Payment</h3>
              
              {/* QR Code Placeholder */}
              <div className="bg-gray-100 rounded-lg p-8 border-2 border-dashed border-gray-300">
                <div className="text-gray-500 mb-4">
                  <div className="w-48 h-48 mx-auto bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gray-200 rounded mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">QR Code Placeholder</p>
                      <p className="text-xs text-gray-500">Replace with actual UPI QR</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Scan the QR code with your UPI app to complete payment of ₹{orderDetails.totalAmount.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRollback}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePaymentComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Payment Complete
                </Button>
              </div>
            </div>
          )}

          {paymentStep === 'complete' && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Payment Successful!</h3>
              <p className="text-gray-600">
                Your payment has been received. Your order will be processed shortly.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    <strong>Verification Required:</strong> If this is your first order or you&apos;re a new user, 
                    please verify your account via WhatsApp as mentioned in the next step.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFlow;
