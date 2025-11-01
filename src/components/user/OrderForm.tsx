/**
 * @file src/components/user/OrderForm.tsx
 * @description Enhanced order submission form with comprehensive validation, 
 * payment flow integration, and WhatsApp verification system.
 * Features modular design with proper error handling and user guidance.
 */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "@/components/ui/file-upload";
import WhatsAppVerification from "@/components/user/WhatsAppVerification";
import { showError, showLoading, updateToSuccess, updateToError } from "@/lib/toast";
import { handleApiError, handleNetworkError, redirectToHomeAfterDelay } from "@/lib/apiErrorHandler";

/**
 * Price per page configuration
 */
const PRICE_PER_PAGE = 5; // ₹5  per page

/**
 * Order form state interface
 */
interface OrderFormState {
  name: string;
  phone: string;
  isNewUser: boolean;
  tokenId: string;
  copies: number;
  files: File[];
  notes: string;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  showPaymentFlow: boolean;
  showVerification: boolean;
  generatedTokenId: string | null;
  orderId: string | null;
}

/**
 * OrderForm component with enhanced functionality
 * @returns JSX element for the order form
 */
const OrderForm = () => {
  const router = useRouter();
  
  // Form State
  const [formState, setFormState] = useState<OrderFormState>({
    name: "",
    phone: "",
    isNewUser: false,
    tokenId: "",
    copies: 1,
    files: [],
    notes: "",
    totalPages: 0,
    isLoading: false,
    error: null,
    showPaymentFlow: false,
    showVerification: false,
    generatedTokenId: null,
    orderId: null,
  });

  /**
   * Updates form state with proper validation
   */
  const updateFormState = (updates: Partial<OrderFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  /**
   * Calculates total amount based on pages and copies
   */
  const totalAmount = formState.totalPages * formState.copies * PRICE_PER_PAGE;

  /**
   * Handles file selection
   * @param newFiles - Array of selected files
   */
  const handleFilesChange = (newFiles: File[]) => {
    updateFormState({ files: newFiles });
  };

  /**
   * Handles manual page count input
   * @param pages - Number of pages entered by user
   */
  const handlePagesChange = (pages: number) => {
    updateFormState({ totalPages: Math.max(1, pages) });
  };

  /**
   * Validates form data before submission
   * @returns Validation result with error message if invalid
   */
  const validateForm = (): { valid: boolean; error?: string } => {
    if (!formState.name.trim()) {
      return { valid: false, error: "Name is required" };
    }
    if (!formState.phone.trim()) {
      return { valid: false, error: "Mobile number is required" };
    }
    if (!/^\d{10}$/.test(formState.phone.replace(/\D/g, ''))) {
      return { valid: false, error: "Please enter a valid 10-digit mobile number" };
    }
    if (!formState.isNewUser && !formState.tokenId.trim()) {
      return { valid: false, error: "Token ID is required for existing users" };
    }
    if (formState.files.length === 0) {
      return { valid: false, error: "Please upload at least one file" };
    }
    if (formState.copies < 1) {
      return { valid: false, error: "Number of copies must be at least 1" };
    }
    if (formState.totalPages < 1) {
      return { valid: false, error: "Number of pages must be at least 1" };
    }
    return { valid: true };
  };

  /**
   * Handles order submission - uploads files first, then routes to payment page
   */
  const handleOrderSubmit = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      showError(validation.error!);
      updateFormState({ error: validation.error! });
      return;
    }

    updateFormState({ isLoading: true, error: null });
    const loadingToast = showLoading("Uploading files...", "Please wait while we process your files");

    try {
      // First upload files
      const formData = new FormData();
      formData.append('phone', formState.phone);
      formState.files.forEach(file => {
        formData.append('files', file);
      });

      console.log('Uploading files:', formState.files.length);
      console.log('Phone:', formState.phone);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorData = await handleApiError(uploadResponse, 'File upload failed');
        
        if (errorData) {
          const suggestion = errorData.suggestion ? `\n\n${errorData.suggestion}` : '';
          updateToError(loadingToast, errorData.error, suggestion);
          updateFormState({ 
            error: errorData.error,
            isLoading: false 
          });
          
          // Redirect to home if server error
          if (errorData.shouldRedirect) {
            redirectToHomeAfterDelay(errorData.error, errorData.suggestion);
          }
        }
        return;
      }

      const uploadResult = await uploadResponse.json();
      console.log('Upload result:', uploadResult);

      // Store order data with uploaded file descriptors for payment page
      const orderData = {
        name: formState.name,
        phone: formState.phone,
        copies: formState.copies,
        notes: formState.notes,
        pages: formState.totalPages,
        files: uploadResult.files, // Use uploaded file descriptors
        isNewUser: formState.isNewUser,
        tokenId: formState.tokenId
      };

      localStorage.setItem('orderData', JSON.stringify(orderData));
      
      // Update loading toast to success and navigate to payment page
      updateToSuccess(loadingToast, "Files uploaded successfully!", "Redirecting to payment page...");
      
      // Small delay to show success message
      setTimeout(() => {
        router.push('/payment');
      }, 1000);

    } catch (error) {
      // Network errors or unexpected errors
      const networkError = handleNetworkError(error, 'File upload failed');
      updateToError(loadingToast, networkError.error, networkError.suggestion);
      updateFormState({ 
        error: networkError.error,
        isLoading: false 
      });
      
      // Network errors - redirect to home after delay
      redirectToHomeAfterDelay(networkError.error, networkError.suggestion);
    }
  };

  /**
   * Handles user verification completion
   */
  const handleVerificationComplete = () => {
    updateFormState({ showVerification: false });
    // Reload page after verification
    window.location.reload();
  };

  /**
   * Closes verification modal
   */
  const handleCloseVerification = () => {
    updateFormState({ showVerification: false });
    // Reload page even if verification is closed
    window.location.reload();
  };

  return (
    <>
      <Card className="max-w-4xl mx-auto bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-gray-900">
            New Print Order
          </CardTitle>
        </CardHeader>
        
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Fields */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 font-medium">
              Full Name *
            </Label>
            <Input 
              id="name" 
              value={formState.name} 
              onChange={(e) => updateFormState({ name: e.target.value })} 
              placeholder="e.g., Rohit Sharma" 
              className="border-gray-300 focus:border-blue-500"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-700 font-medium">
              WhatsApp Number *
            </Label>
            <Input 
              id="phone" 
              value={formState.phone} 
              onChange={(e) => updateFormState({ phone: e.target.value })} 
              placeholder="e.g., 9876543210" 
              type="tel" 
              className="border-gray-300 focus:border-blue-500"
              required 
            />
          </div>
          
          <div className="flex items-center space-x-2 md:col-span-2">
            <Checkbox 
              id="new-user" 
              checked={formState.isNewUser} 
              onCheckedChange={(checked) => updateFormState({ 
                isNewUser: Boolean(checked),
                tokenId: Boolean(checked) ? "" : formState.tokenId
              })} 
            />
            <Label htmlFor="new-user" className="text-gray-700 font-medium">
              I&apos;m new User
            </Label>
          </div>

          {!formState.isNewUser && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tokenId" className="text-gray-700 font-medium">
                Your Token ID *
              </Label>
              <Input 
                id="tokenId" 
                value={formState.tokenId} 
                onChange={(e) => updateFormState({ tokenId: e.target.value })} 
                placeholder="Enter your existing Token ID" 
                className="border-gray-300 focus:border-blue-500"
                required 
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="copies" className="text-gray-700 font-medium">
              Number of Copies *
            </Label>
            <Input 
              id="copies" 
              type="number" 
              value={formState.copies} 
              onChange={(e) => updateFormState({ copies: Math.max(1, parseInt(e.target.value) || 1) })} 
              min="1" 
              className="border-gray-300 focus:border-blue-500"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pages" className="text-gray-700 font-medium">
              Number of Pages *
            </Label>
            <Input 
              id="pages" 
              type="number" 
              value={formState.totalPages} 
              onChange={(e) => handlePagesChange(parseInt(e.target.value) || 1)} 
              min="1" 
              className="border-gray-300 focus:border-blue-500"
              required 
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-gray-700 font-medium">
              Upload Files *
            </Label>
            <FileUpload
              files={formState.files}
              onFilesChange={handleFilesChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              maxFiles={10}
              maxSizeInMB={10}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes" className="text-gray-700 font-medium">
              Special Instructions
            </Label>
            <Input 
              id="notes" 
              value={formState.notes} 
              onChange={(e) => updateFormState({ notes: e.target.value })} 
              placeholder="e.g., Black & White, single-sided, specific paper type" 
              className="border-gray-300 focus:border-blue-500"
            />
          </div>
          
          {/* Print Summary */}
          <div className="md:col-span-2 p-6 rounded-lg bg-blue-50 border border-blue-200">
            <h4 className="font-bold text-gray-900 mb-3 text-lg">Print Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Pages </p>
                <p className="text-lg font-semibold text-gray-900">{formState.totalPages}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Number of Copies</p>
                <p className="text-lg font-semibold text-gray-900">{formState.copies}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Final Price</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {formState.error && (
            <div className="md:col-span-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{formState.error}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-4 bg-gray-50 px-6 py-4">
          <Button 
            onClick={handleOrderSubmit} 
            disabled={formState.isLoading}
            className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-2"
          >
            {formState.isLoading ? 'Placing Order...' : 'Place Order'}
          </Button>
        </CardFooter>
      </Card>

      {/* WhatsApp Verification Modal - Only for new users */}
      {formState.showVerification && formState.generatedTokenId && (
        <WhatsAppVerification
          tokenId={formState.generatedTokenId}
          isNewUser={formState.isNewUser}
          onClose={handleCloseVerification}
          onVerified={handleVerificationComplete}
        />
      )}
    </>
  );
};

export default OrderForm;
