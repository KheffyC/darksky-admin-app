'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PermissionGuard } from './auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';
import { usePaymentNotifications } from '@/contexts/PaymentNotificationContext';

export function MobileNav() {
  const pathname = usePathname();
  const { unmatchedCount } = usePaymentNotifications();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 bg-slate-950/92 pb-8 backdrop-blur-xl md:hidden">
      <div className="flex h-16 items-center justify-around px-3">
        <Link 
          href="/dashboard"
          className={`flex h-full w-full flex-col items-center justify-center space-y-1 rounded-2xl ${
            isActive('/dashboard') ? 'text-emerald-300' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <PermissionGuard permission={PERMISSIONS.VIEW_ALL_PAYMENTS}>
          <Link 
            href="/dashboard/payments"
            className={`relative flex h-full w-full flex-col items-center justify-center space-y-1 rounded-2xl ${
              isActive('/dashboard/payments') ? 'text-emerald-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              {unmatchedCount > 0 && (
                <span className="absolute -right-2 -top-1 min-w-[16px] rounded-full border border-slate-950 bg-emerald-400 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-950">
                  {unmatchedCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Payments</span>
          </Link>
        </PermissionGuard>

        <Link 
          href="/dashboard/ledger"
          className={`flex h-full w-full flex-col items-center justify-center space-y-1 rounded-2xl ${
            isActive('/dashboard/ledger') ? 'text-emerald-300' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m3 6V7m3 10v-4m5 6H4a1 1 0 01-1-1V4a1 1 0 011-1h16a1 1 0 011 1v14a1 1 0 01-1 1z" />
          </svg>
          <span className="text-[10px] font-medium">Ledger</span>
        </Link>

        <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
          <Link 
            href="/dashboard/settings"
            className={`flex h-full w-full flex-col items-center justify-center space-y-1 rounded-2xl ${
              isActive('/dashboard/settings') ? 'text-emerald-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </PermissionGuard>
      </div>
    </div>
  );
}
