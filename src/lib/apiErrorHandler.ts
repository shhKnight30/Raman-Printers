/**
 * @file src/lib/apiErrorHandler.ts
 * @description Client-side API error handler utility
 * Handles server errors by redirecting to home page and refreshing
 * Provides clean error handling without crashing the application
 */

/**
 * Checks if the error response indicates a server error (500+)
 * @param response - Fetch Response object
 * @returns boolean indicating if it's a server error
 */
export function isServerError(response: Response): boolean {
  return response.status >= 500;
}

/**
 * Checks if the error response indicates a client error (400-499)
 * @param response - Fetch Response object
 * @returns boolean indicating if it's a client error
 */
export function isClientError(response: Response): boolean {
  return response.status >= 400 && response.status < 500;
}

/**
 * Handles API errors - redirects to home and refreshes on server errors
 * @param response - Fetch Response object
 * @param defaultMessage - Optional custom error message if API response is invalid
 * @returns Error data if available, or null if parsing fails
 */
export async function handleApiError(
  response: Response,
  defaultMessage?: string
): Promise<{
  error: string;
  suggestion?: string;
  isServerError: boolean;
  shouldRedirect: boolean;
} | null> {
  const serverError = isServerError(response);
  
  try {
    // Try to parse error response from API
    const errorData = await response.json();
    
    return {
      error: errorData.error || defaultMessage || 'An error occurred',
      suggestion: errorData.suggestion,
      isServerError: serverError,
      shouldRedirect: serverError // Always redirect on server errors
    };
  } catch (parseError) {
    // If JSON parsing fails, return default error structure
    console.error('Failed to parse error response:', parseError);
    return {
      error: defaultMessage || `Request failed with status ${response.status}`,
      suggestion: serverError 
        ? 'A server error occurred. Please try again later.'
        : 'Please check your input and try again.',
      isServerError: serverError,
      shouldRedirect: serverError
    };
  }
}

/**
 * Redirects to home page after showing error message
 * @param message - Error message to display
 * @param suggestion - Optional suggestion message
 * @param delay - Delay in milliseconds before redirect (default: 3000ms)
 */
export function redirectToHomeAfterDelay(
  message: string,
  suggestion?: string,
  delay: number = 3000
): void {
  console.error('Redirecting to home due to error:', message);
  
  // Show error in console
  if (suggestion) {
    console.error('Suggestion:', suggestion);
  }
  
  // Redirect after delay
  setTimeout(() => {
    window.location.href = '/';
  }, delay);
}

/**
 * Handles network errors (fetch failures, connection issues)
 * @param error - The error that occurred
 * @param defaultMessage - Default error message
 * @returns Error information
 */
export function handleNetworkError(
  error: unknown,
  defaultMessage: string = 'Network error occurred'
): { error: string; suggestion: string } {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  
  // Check if it's a network-related error
  const isNetworkIssue = error instanceof TypeError && 
    (error.message.includes('fetch') || 
     error.message.includes('network') ||
     error.message.includes('Failed to fetch'));
  
  return {
    error: isNetworkIssue 
      ? 'Network connection failed'
      : errorMessage,
    suggestion: isNetworkIssue
      ? 'Please check your internet connection and try again.'
      : 'Please try again later.'
  };
}

