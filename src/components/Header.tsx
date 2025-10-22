import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { PermissionGuard, useAuth } from './auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

export function Header() {
  const { data: session } = useSession();
  const { role } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (!session) {
    return null;
  }

  return (
    <header className="bg-gradient-to-r from-black via-gray-900 to-black shadow-2xl border-b border-gray-600 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image 
                src="/DSP_LOGO.png" 
                alt="DSP Logo" 
                width={40} 
                height={40}
                className="rounded hover:opacity-80 transition-opacity duration-200"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/dashboard"
              className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200"
            >
              Dashboard
            </Link>
            
            <PermissionGuard permission={PERMISSIONS.VIEW_ALL_PAYMENTS}>
              <Link 
                href="/dashboard/ledger"
                className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Ledger
              </Link>
            </PermissionGuard>

            <PermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
              <Link 
                href="/dashboard/users"
                className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Users
              </Link>
            </PermissionGuard>
            
            <PermissionGuard permission={PERMISSIONS.PROCESS_PAYMENTS}>
              <Link 
                href="/dashboard/reconcile"
                className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Payments
              </Link>
            </PermissionGuard>
            
            <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
              <Link 
                href="/dashboard/settings"
                className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Settings
              </Link>
            </PermissionGuard>
          </nav>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:ring-offset-gray-900"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-medium">
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-gray-300 capitalize">
                    {role}
                  </p>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl py-1 z-50 border border-gray-600">
                <div className="px-4 py-2 border-b border-gray-600">
                  <p className="text-sm font-medium text-white">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-gray-300">
                    {session.user?.email}
                  </p>
                  <p className="text-xs text-gray-300 capitalize">
                    {role} Role
                  </p>
                </div>
                
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 p-2 rounded-lg"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-600 py-2 bg-gradient-to-b from-gray-900 to-black">
            <div className="space-y-1">
              <Link 
                href="/dashboard"
                className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              
              <PermissionGuard permission={PERMISSIONS.VIEW_MEMBER_DETAILS}>
                <Link 
                  href="/dashboard/members"
                  className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Members
                </Link>
              </PermissionGuard>
              
              <PermissionGuard permission={PERMISSIONS.VIEW_ALL_PAYMENTS}>
                <Link 
                  href="/dashboard/ledger"
                  className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Ledger
                </Link>
              </PermissionGuard>
              
              <PermissionGuard permission={PERMISSIONS.PROCESS_PAYMENTS}>
                <Link 
                  href="/dashboard/reconcile"
                  className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Reconcile
                </Link>
              </PermissionGuard>
              
              <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
                <Link 
                  href="/dashboard/settings"
                  className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
              </PermissionGuard>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
