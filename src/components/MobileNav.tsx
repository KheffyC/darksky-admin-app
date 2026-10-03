'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PermissionGuard, usePermission } from './auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';
import { usePaymentNotifications } from '@/contexts/PaymentNotificationContext';

const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  projects: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm3 9l3 3 5-6',
  notes: 'M5 3h10l4 4v14H5zM9 11h6M9 15h6',
  calendar: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2zM4 10h16M8 2v4M16 2v4',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
};

function NavIcon({ path, bold = false }: { path: string; bold?: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={bold ? 3 : 2} d={path} />
    </svg>
  );
}

const MORE_LINKS = [
  { href: '/dashboard/reimbursements', label: 'Reimbursements', description: 'Receipts for out-of-pocket purchases' },
  { href: '/dashboard/payments', label: 'Payments', description: 'Schedules, ledger, and reconciling', permission: PERMISSIONS.VIEW_ALL_PAYMENTS },
  { href: '/dashboard/links', label: 'Links', description: 'Shortcuts into Google Drive' },
  { href: '/dashboard/settings', label: 'Settings', description: 'Seasons and integrations', permission: PERMISSIONS.MANAGE_SETTINGS },
  { href: '/dashboard/users', label: 'Users', description: 'Who can sign in', permission: PERMISSIONS.MANAGE_USERS },
  { href: '/dashboard/profile', label: 'Profile & notifications', description: 'Password and phone alerts' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { unmatchedCount } = usePaymentNotifications();
  const canSeePayments = usePermission(PERMISSIONS.VIEW_ALL_PAYMENTS);
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the menu after navigating
  useEffect(() => setMoreOpen(false), [pathname]);

  const isActive = (path: string) => (path === '/dashboard' ? pathname === '/dashboard' : pathname === path || pathname.startsWith(`${path}/`));
  const moreActive = MORE_LINKS.some((link) => isActive(link.href));
  const moreBadge = canSeePayments && unmatchedCount > 0;

  const tabClass = (active: boolean) =>
    `relative flex h-full w-full flex-col items-center justify-center space-y-1 rounded-2xl touch-manipulation select-none ${
      active ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
    }`;

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMoreOpen(false)}>
          <nav
            aria-label="More"
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-x-3 bottom-28 rounded-3xl border border-white/10 bg-neutral-950 p-2"
          >
            {MORE_LINKS.map((link) => {
              const item = (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex min-h-[52px] items-center justify-between gap-3 rounded-2xl px-4 py-2 ${
                    isActive(link.href) ? 'bg-white/10 text-white' : 'text-neutral-200 hover:bg-white/5'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{link.label}</span>
                    <span className="block text-xs text-neutral-400">{link.description}</span>
                  </span>
                  {link.href === '/dashboard/payments' && unmatchedCount > 0 && (
                    <span className="min-w-[20px] rounded-full bg-flag-solid px-1.5 py-0.5 text-center text-xs font-bold text-neutral-950">
                      {unmatchedCount}
                    </span>
                  )}
                </Link>
              );
              return link.permission ? (
                <PermissionGuard key={link.href} permission={link.permission}>
                  {item}
                </PermissionGuard>
              ) : (
                item
              );
            })}
          </nav>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 bg-neutral-950/92 pb-8 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-around px-3">
          <Link href="/dashboard" className={tabClass(isActive('/dashboard'))}>
            <NavIcon path={ICONS.home} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/dashboard/calendar" className={tabClass(isActive('/dashboard/calendar'))}>
            <NavIcon path={ICONS.calendar} />
            <span className="text-[10px] font-medium">Calendar</span>
          </Link>
          <Link href="/dashboard/projects" className={tabClass(isActive('/dashboard/projects'))}>
            <NavIcon path={ICONS.projects} />
            <span className="text-[10px] font-medium">Projects</span>
          </Link>
          <Link href="/dashboard/notes" className={tabClass(isActive('/dashboard/notes'))}>
            <NavIcon path={ICONS.notes} />
            <span className="text-[10px] font-medium">Notes</span>
          </Link>
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            aria-expanded={moreOpen}
            className={tabClass(moreOpen || moreActive)}
          >
            <span className="relative">
              <NavIcon path={ICONS.more} bold />
              {moreBadge && (
                <span className="absolute -right-2 -top-1 min-w-[16px] rounded-full border border-neutral-950 bg-flag-solid px-1.5 py-0.5 text-center text-[10px] font-bold text-neutral-950">
                  {unmatchedCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
}
