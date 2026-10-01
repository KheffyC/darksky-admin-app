import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { PermissionGuard, useAuth } from './auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';
import { usePaymentNotifications } from '@/contexts/PaymentNotificationContext';
import { SeasonSelector } from './SeasonSelector';

export function Header() {
  const { data: session } = useSession();
  const { role } = useAuth();
  const { unmatchedCount } = usePaymentNotifications();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (!session) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-black backdrop-blur-xl">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="group flex items-center gap-3">
              <Image 
                src="/DSP_LOGO.png" 
                alt="DSP Logo" 
                width={40} 
                height={40}
                className="rounded transition-opacity duration-200 group-hover:opacity-80"
              />
              <div className="hidden sm:block">
                <span className="block text-base font-semibold tracking-[0.08em] text-white uppercase">Dark Sky</span>
                <span className="block text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">Finance Admin</span>
              </div>
            </Link>

          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <nav className="hidden items-center gap-2 md:flex">
              <Link 
                href="/dashboard"
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white"
              >
                Overview
              </Link>
              <PermissionGuard permission={PERMISSIONS.VIEW_ALL_PAYMENTS}>
                <Link 
                  href="/dashboard/payments"
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white"
                >
                  Payments
                  {unmatchedCount > 0 && (
                    <span className="min-w-[20px] rounded-full bg-flag-solid px-1.5 py-0.5 text-center text-xs font-bold text-ink">
                      {unmatchedCount}
                    </span>
                  )}
                </Link>
              </PermissionGuard>
              
              <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
                <Link 
                  href="/dashboard/settings"
                  className="rounded-full px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white"
                >
                  Settings
                </Link>
              </PermissionGuard>
            </nav>

            <SeasonSelector />

            <div className="relative z-50">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-label="Open profile menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                  <span className="text-sm font-semibold text-ink">
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 z-[200] mt-2 w-56 rounded-2xl border border-white/10 bg-black py-1 backdrop-blur-xl">
                  <div className="border-b border-white/8 px-4 py-3">
                    <p className="text-sm font-medium text-white">
                      {session.user?.name}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {session.user?.email}
                    </p>
                    <p className="text-xs capitalize text-neutral-400">
                      {role} Role
                    </p>
                  </div>
                  
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2.5 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Profile Settings
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="block w-full px-4 py-2.5 text-left text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
