'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/ledger', label: 'Member Ledger' },
    { href: '/dashboard/reconcile', label: 'Reconcile Payments' },
    { href: '/dashboard/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-black via-gray-900 to-black shadow-2xl border-b border-gray-600 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo/Brand */}
            <div className="flex items-center mr-12">
              <Link href="/dashboard" className="block">
                <Image 
                  src="/DSP_LOGO.png" 
                  alt="Dark Sky Admin" 
                  width={120}
                  height={48}
                  className="h-12 w-auto hover:opacity-80 transition-opacity duration-200"
                  priority
                />
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-6 text-base font-bold transition-colors duration-300 ${
                    pathname === item.href
                      ? 'text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                  {pathname === item.href && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 animate-pulse"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-200 hover:text-white p-3 rounded-xl hover:bg-gray-700/50 transition-all duration-200 border border-transparent hover:border-gray-500/50"
              >
                <span className="sr-only">Open menu</span>
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-600 bg-gradient-to-b from-gray-900 to-black backdrop-blur-sm">
            <div className="px-4 pt-4 pb-6 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative block px-4 py-4 text-lg font-bold transition-colors duration-200 ${
                    pathname === item.href
                      ? 'text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                  {pathname === item.href && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-400 animate-pulse"></div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
