/**
 * @file src/app/layout.tsx
 * @description The root layout for the entire application.
 * It applies the global background, font, and theme settings.
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AkPrints - Your Printing Solution",
  description: "High-quality printing services at your fingertips.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="!scroll-smooth">
      <body
        className={`${inter.className} bg-cover bg-center`}
        style={{ backgroundImage: "url('/backgrounds/default.jpg')" }}
      >
        <main className="min-h-screen bg-white bg-opacity-90 text-gray-900">
          {children}
        </main>
        <Toaster 
          position="top-right"
          expand={true}
          richColors={true}
          closeButton={true}
          duration={4000}
        />
      </body>
    </html>
  );
}
