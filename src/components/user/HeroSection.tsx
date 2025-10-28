/**
 * @file src/components/user/HeroSection.tsx
 * @description The main hero section of the landing page with enhanced styling and accessibility.
 * Features centered content with call-to-action buttons and responsive design.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * HeroSection component displays the main landing content
 * @returns JSX element for the hero section
 */
const HeroSection = () => {
  return (
    <section className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 text-gray-900">
          Raman Prints
        </h1>
        <p className="text-xl md:text-2xl mb-12 text-gray-700 max-w-2xl mx-auto">
          Fast, Reliable, and High-Quality Printing Services at Your Fingertips
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="#order">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-black cursor-pointer hover:bg-black text-white px-8 py-3 text-lg"
            >
              Print Order
            </Button>
          </Link>
          <Link href="#track">
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto border-black cursor-pointer text-black hover:bg-blue-50 px-8 py-3 text-lg"
            >
              Track Print
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
