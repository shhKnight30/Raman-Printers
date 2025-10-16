/**
 * @file src/components/user/Navbar.tsx
 * @description Provides navigation for the main page with smooth scroll links.
 * Features responsive navigation with theme toggle and proper accessibility.
 */
"use client";
import Link from "next/link";
import ThemeToggle from "@/components/ui/theme-toggle";

/**
 * Navigation link interface for type safety
 */
interface NavLink {
  name: string;
  href: string;
}

/**
 * Navbar component with responsive design and theme toggle
 * @returns JSX element for the main navigation
 */
const Navbar = () => {
  const navLinks: NavLink[] = [
    { name: "Home", href: "#home" },
    { name: "Print Order", href: "#order" },
    { name: "Track Print", href: "#track" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <nav className="flex items-center justify-between py-4 px-4 max-w-7xl mx-auto">
        <Link 
          href="#home" 
          className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
        >
          ARPrints
        </Link>
        
        <ul className="flex items-center space-x-6">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link 
                href={link.href} 
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                {link.name}
              </Link>
            </li>
          ))}
          <li>
            <ThemeToggle />
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
