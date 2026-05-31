import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { PermissionGuard, useAuth } from './auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';
import { usePaymentNotifications } from '@/contexts/PaymentNotificationContext';

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
              <div>
                <span className="block text-base font-semibold tracking-[0.08em] text-white uppercase">Dark Sky</span>
                <span className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Finance Admin</span>
              </div>
            </Link>

            <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200 lg:inline-flex">
              Live operations
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <Link 
              href="/dashboard"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Overview
            </Link>
            <PermissionGuard permission={PERMISSIONS.VIEW_ALL_PAYMENTS}>
              <Link 
                href="/dashboard/payments"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Payments
                {unmatchedCount > 0 && (
                  <span className="min-w-[20px] rounded-full bg-emerald-400 px-1.5 py-0.5 text-center text-xs font-bold text-slate-950">
                    {unmatchedCount}
                  </span>
                )}
              </Link>
            </PermissionGuard>

            <Link 
              href="/dashboard/ledger"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Ledger
            </Link>
            
            <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
              <Link 
                href="/dashboard/settings"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Settings
              </Link>
            </PermissionGuard>
          </nav>

          <div className="relative z-50">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2.5 py-2 text-sm transition hover:border-white/20 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-sky-300">
                  <span className="text-white text-sm font-medium">
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium text-white">
                    {session.user?.name}
                  </p>
                  <p className="text-xs capitalize text-slate-400">
                    {role} role
                  </p>
                </div>
              </div>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 z-[200] mt-2 w-56 rounded-2xl border border-white bg-black py-1 backdrop-blur-xl">
                <div className="border-b border-white/8 px-4 py-3">
                  <p className="text-sm font-medium text-white">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {session.user?.email}
                  </p>
                  <p className="text-xs capitalize text-slate-400">
                    {role} Role
                  </p>
                </div>
                
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
