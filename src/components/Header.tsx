import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { PermissionGuard, useAuth } from './auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

export function Header() {
  const { data: session } = useSession();
  const { role } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (!session) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image 
                src="/DSP_Mark_Black.png" 
                alt="DSP Logo" 
                width={32} 
                height={32}
                className="rounded"
              />
              <h1 className="text-xl font-semibold text-gray-900">
                DSP Admin
              </h1>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            
            <PermissionGuard permission={PERMISSIONS.VIEW_ALL_PAYMENTS}>
              <Link 
                href="/dashboard/ledger"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Ledger
              </Link>
            </PermissionGuard>
            
            <PermissionGuard permission={PERMISSIONS.PROCESS_PAYMENTS}>
              <Link 
                href="/dashboard/reconcile"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Reconcile
              </Link>
            </PermissionGuard>

            
            <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
              <Link 
                href="/dashboard/settings"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Settings
              </Link>
            </PermissionGuard>
          </nav>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {role}
                  </p>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {role} Role
                  </p>
                </div>
                
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="space-y-1">
              <Link 
                href="/dashboard"
                className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              
              <PermissionGuard permission={PERMISSIONS.VIEW_ALL_PAYMENTS}>
                <Link 
                  href="/dashboard/ledger"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ledger
                </Link>
              </PermissionGuard>
              
              <PermissionGuard permission={PERMISSIONS.PROCESS_PAYMENTS}>
                <Link 
                  href="/dashboard/reconcile"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Reconcile
                </Link>
              </PermissionGuard>
              
              <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
                <Link 
                  href="/dashboard/settings"
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
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
