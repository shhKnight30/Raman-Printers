/**
 * @file src/app/admin/login/page.tsx
 * @description Admin login page with passcode authentication.
 * Features form validation, loading states, and proper error handling.
 */
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { showError, showLoading, updateToSuccess, updateToError } from "@/lib/toast";
import { handleApiError, handleNetworkError, redirectToHomeAfterDelay } from "@/lib/apiErrorHandler";

/**
 * AdminLogin component with enhanced security features
 * @returns JSX element for admin login page
 */
const AdminLogin = () => {
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  /**
   * Handles form submission with validation
   * @param e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Basic validation
    if (!passcode.trim()) {
      showError("Please enter the admin passcode");
      setError("Please enter the admin passcode");
      setIsLoading(false);
      return;
    }

    const loadingToast = showLoading("Signing in...", "Please wait while we verify your credentials");

    // Call admin session API
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          updateToSuccess(loadingToast, "Login successful!", "Redirecting to dashboard...");
          setTimeout(() => {
            window.location.href = "/admin/dashboard";
          }, 1000);
        } else {
          // Handle non-success response
          const errorData = await handleApiError(response, 'Login failed');
          if (errorData) {
            updateToError(loadingToast, errorData.error, errorData.suggestion);
            setError(errorData.error);
            
            // Redirect if server error
            if (errorData.shouldRedirect) {
              redirectToHomeAfterDelay(errorData.error, errorData.suggestion);
            }
          }
        }
      } else {
        // Handle error response WITHOUT throwing
        const errorData = await handleApiError(response, 'Invalid passcode');
        if (errorData) {
          updateToError(loadingToast, errorData.error, errorData.suggestion);
          setError(errorData.error);
          
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          
          if (newAttempts >= 3) {
            const lockMsg = "Too many failed attempts. Please try again later.";
            updateToError(loadingToast, lockMsg);
            setError(lockMsg);
          }
          
          // Redirect if server error
          if (errorData.shouldRedirect) {
            redirectToHomeAfterDelay(errorData.error, errorData.suggestion);
          }
        }
      }
    } catch (err: unknown) {
      // Network errors only
      const networkError = handleNetworkError(err, 'Login failed. Please try again.');
      updateToError(loadingToast, networkError.error, networkError.suggestion);
      setError(networkError.error);
      
      // Network errors - redirect to home after delay
      redirectToHomeAfterDelay(networkError.error, networkError.suggestion);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggles password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundImage: "url('/backgrounds/default.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="absolute inset-0 bg-white bg-opacity-90"></div>
      
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-2xl relative z-10">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Admin Portal
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Secure access to Raman Prints management system
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="passcode" className="text-gray-700 font-medium">
                Admin Passcode
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="passcode"
                  type={showPassword ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter admin passcode"
                  className="pl-10 pr-10 border-gray-300 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              This is a secure admin portal. All activities are logged.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
