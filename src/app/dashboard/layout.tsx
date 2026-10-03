'use client';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PaymentNotificationProvider } from '@/contexts/PaymentNotificationContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ink"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <p className="text-muted">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <PaymentNotificationProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="pb-32 pt-6 md:pt-8 lg:pb-8">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <div className="print:hidden">
          <MobileNav />
        </div>
      </div>
    </PaymentNotificationProvider>
  );
}
