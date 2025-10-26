/**
 * @file src/lib/toast.ts
 * @description Toast notification utility functions
 * Provides consistent toast notifications throughout the application
 */

import { toast } from "sonner";

/**
 * Shows a success toast notification
 * @param message - Success message to display
 * @param description - Optional description
 */
export function showSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 4000,
  });
}

/**
 * Shows an error toast notification
 * @param message - Error message to display
 * @param description - Optional description
 */
export function showError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: 5000,
  });
}

/**
 * Shows a warning toast notification
 * @param message - Warning message to display
 * @param description - Optional description
 */
export function showWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 4000,
  });
}

/**
 * Shows an info toast notification
 * @param message - Info message to display
 * @param description - Optional description
 */
export function showInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 4000,
  });
}

/**
 * Shows a loading toast notification
 * @param message - Loading message to display
 * @param description - Optional description
 */
export function showLoading(message: string, description?: string) {
  return toast.loading(message, {
    description,
  });
}

/**
 * Updates a loading toast to success
 * @param toastId - ID of the loading toast
 * @param message - Success message
 * @param description - Optional description
 */
export function updateToSuccess(toastId: string | number, message: string, description?: string) {
  toast.success(message, {
    id: toastId,
    description,
    duration: 4000,
  });
}

/**
 * Updates a loading toast to error
 * @param toastId - ID of the loading toast
 * @param message - Error message
 * @param description - Optional description
 */
export function updateToError(toastId: string | number, message: string, description?: string) {
  toast.error(message, {
    id: toastId,
    description,
    duration: 5000,
  });
}

/**
 * Dismisses a specific toast
 * @param toastId - ID of the toast to dismiss
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

/**
 * Dismisses all toasts
 */
export function dismissAllToasts() {
  toast.dismiss();
}

/**
 * Common toast messages for consistency
 */
export const ToastMessages = {
  // Order related
  ORDER_PLACED: "Order placed successfully!",
  ORDER_UPDATED: "Order updated successfully!",
  ORDER_CANCELLED: "Order cancelled successfully!",
  ORDER_NOT_FOUND: "Order not found. Please check your details.",
  
  // User related
  USER_VERIFIED: "User verified successfully!",
  TOKEN_GENERATED: "New token generated successfully!",
  TOKEN_INVALID: "Invalid token. Please check your Token ID.",
  
  // File related
  FILES_UPLOADED: "Files uploaded successfully!",
  FILE_DELETED: "File deleted successfully!",
  FILE_TOO_LARGE: "File size exceeds limit.",
  FILE_TYPE_INVALID: "File type not supported.",
  
  // Payment related
  PAYMENT_PENDING: "Payment marked as pending.",
  PAYMENT_VERIFIED: "Payment verified successfully!",
  
  // Admin related
  LOGIN_SUCCESS: "Login successful!",
  LOGIN_FAILED: "Login failed. Please check credentials.",
  LOGOUT_SUCCESS: "Logged out successfully!",
  
  // General
  LOADING: "Please wait...",
  SUCCESS: "Operation completed successfully!",
  ERROR: "Something went wrong. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  VALIDATION_ERROR: "Please check your input and try again.",
} as const;
