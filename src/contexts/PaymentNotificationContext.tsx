'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface PaymentNotificationContextType {
  unmatchedCount: number;
  refreshCounts: () => Promise<void>;
  loading: boolean;
}

const PaymentNotificationContext = createContext<PaymentNotificationContextType | undefined>(undefined);

export function PaymentNotificationProvider({ children }: { children: React.ReactNode }) {
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/reconcile');
      if (res.ok) {
        const data = await res.json();
        setUnmatchedCount(data.payments?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unmatched payments count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const runStripeImport = useCallback(async () => {
    const lastRefresh = sessionStorage.getItem('lastStripeRefresh');
    const now = Date.now();
    const COOLDOWN = 5 * 60 * 1000; // 5 minutes

    if (!lastRefresh || (now - parseInt(lastRefresh)) > COOLDOWN) {
      try {
        await fetch('/api/stripe/import');
        sessionStorage.setItem('lastStripeRefresh', now.toString());
        // Refresh counts after import
        await refreshCounts();
      } catch (error) {
        console.error('Background Stripe import failed:', error);
      }
    } else {
      // Even if we don't import, we should fetch the current count
      await refreshCounts();
    }
  }, [refreshCounts]);

  useEffect(() => {
    runStripeImport();
  }, [runStripeImport]);

  return (
    <PaymentNotificationContext.Provider value={{ unmatchedCount, refreshCounts, loading }}>
      {children}
    </PaymentNotificationContext.Provider>
  );
}

export function usePaymentNotifications() {
  const context = useContext(PaymentNotificationContext);
  if (context === undefined) {
    throw new Error('usePaymentNotifications must be used within a PaymentNotificationProvider');
  }
  return context;
}
