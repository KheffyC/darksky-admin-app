'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PermissionGuard } from './auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        <Link 
          href="/dashboard"
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            isActive('/dashboard') ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <PermissionGuard permission={PERMISSIONS.VIEW_ALL_PAYMENTS}>
          <Link 
            href="/dashboard/ledger"
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive('/dashboard/ledger') ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-[10px] font-medium">Ledger</span>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission={PERMISSIONS.PROCESS_PAYMENTS}>
          <Link 
            href="/dashboard/reconcile"
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive('/dashboard/reconcile') ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-[10px] font-medium">Payments</span>
          </Link>
        </PermissionGuard>

        <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
          <Link 
            href="/dashboard/settings"
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive('/dashboard/settings') ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
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
