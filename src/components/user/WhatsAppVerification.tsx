/**
 * @file src/components/user/WhatsAppVerification.tsx
 * @description WhatsApp verification component for new users.
 * Provides easy access to WhatsApp with pre-filled verification message.
 */
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, CheckCircle, X } from "lucide-react";

/**
 * Props interface for WhatsAppVerification component
 */
interface WhatsAppVerificationProps {
  tokenId: string;
  isNewUser: boolean;
  onClose: () => void;
  onVerified: () => void;
}

/**
 * WhatsAppVerification component handles user verification via WhatsApp
 * @param tokenId - The token ID to be verified
 * @param isNewUser - Whether this is a new user verification
 * @param onClose - Callback to close the verification modal
 * @param onVerified - Callback when user claims to be verified
 * @returns JSX element for WhatsApp verification
 */
const WhatsAppVerification: React.FC<WhatsAppVerificationProps> = ({
  tokenId,
  isNewUser,
  onClose,
  onVerified,
}) => {
  /**
   * Admin WhatsApp number from environment variable
   */
  const ADMIN_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "919412010234"; 

  /**
   * Generates WhatsApp URL with pre-filled message
   * @returns WhatsApp URL string
   */
  const generateWhatsAppURL = () => {
    const message = `verify #${tokenId}`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedMessage}`;
  };

  /**
   * Opens WhatsApp with pre-filled verification message
   */
  const openWhatsApp = () => {
    window.open(generateWhatsAppURL(), '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">
            User Verification
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
          {/* Verification Info */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isNewUser ? 'New User Verification' : 'Token Verification'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isNewUser 
                  ? 'As a new user, you need to verify your account via WhatsApp to complete your first order.'
                  : 'Please verify your token ID via WhatsApp to ensure account security.'
                }
              </p>
            </div>
          </div>

          {/* Token Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Your Token ID:</h4>
            <div className="flex items-center justify-between bg-white rounded border p-3">
              <code className="text-sm font-mono text-gray-800">#{tokenId}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(tokenId)}
                className="text-xs"
              >
                Copy
              </Button>
            </div>
          </div>

          {/* WhatsApp Instructions */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Verification Steps:</h4>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">1</span>
                <span>Click the WhatsApp button below</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">2</span>
                <span>Send the pre-filled verification message</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">3</span>
                <span>Wait for admin verification</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">4</span>
                <span>Click &quot;I&apos;m Verified&quot; once confirmed</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={openWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Open WhatsApp
            </Button>
            
        <Button
          onClick={onVerified}
          variant="outline"
          className="w-full border-green-600 text-green-600 hover:bg-green-50"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          I've Sent the Verification Message
        </Button>
          </div>

          {/* Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Verification usually takes a few minutes. 
              You can close this window and check back later if needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppVerification;

