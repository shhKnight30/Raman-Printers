/**
 * @file src/app/page.tsx
 * @description The main landing page for AkPrints, composed of different sections.
 */
"use client";
import { useState, useEffect } from "react";
import HeroSection from "@/components/user/HeroSection";
import Navbar from "@/components/user/Navbar";
import OrderForm from "@/components/user/OrderForm";
import TrackOrder from "@/components/user/TrackOrder";
import WhatsAppVerification from "@/components/user/WhatsAppVerification";

export default function HomePage() {
  const [showVerification, setShowVerification] = useState(false);
  const [verificationTokenId, setVerificationTokenId] = useState<string | null>(null);

  // Check for verification parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showVerificationParam = urlParams.get('showVerification');
    const tokenId = urlParams.get('tokenId');
    
    if (showVerificationParam === 'true' && tokenId) {
      setShowVerification(true);
      setVerificationTokenId(tokenId);
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleVerificationComplete = () => {
    setShowVerification(false);
    setVerificationTokenId(null);
    // Reload page to refresh all states
    window.location.reload();
  };

  const handleCloseVerification = () => {
    setShowVerification(false);
    setVerificationTokenId(null);
    // Reload page to refresh all states
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4">
      <Navbar />
      <div id="home">
        <HeroSection />
      </div>
      <div id="order" className="py-20">
        <h2 className="text-4xl font-bold text-center mb-8">Place a Print Order</h2>
        <OrderForm />
      </div>
      <div id="track" className="py-20">
        <h2 className="text-4xl font-bold text-center mb-8">Track Your Order</h2>
        <TrackOrder />
      </div>
      <footer className="text-center py-6">
        <p>&copy; 2025 AkPrints. All rights reserved.</p>
        <p className="text-sm text-gray-400 mt-2">
          <a href="/admin/login" className="hover:text-blue-400 transition-colors">
            Admin Login
          </a>
        </p>
      </footer>

      {/* WhatsApp Verification Modal - Only for new users */}
      {showVerification && verificationTokenId && (
        <WhatsAppVerification
          tokenId={verificationTokenId}
          isNewUser={true}
          onClose={handleCloseVerification}
          onVerified={handleVerificationComplete}
        />
      )}
    </div>
  );
}
