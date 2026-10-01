'use client';

import { useEffect, useState } from 'react';

interface SummaryStats {
  totalPaid: number;
  outstanding: number;
  unmatchedCount: number;
  loading: boolean;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function FinancialSummary({ 
  onUnmatchedClick,
  onStatsLoaded
}: { 
  onUnmatchedClick?: () => void;
  onStatsLoaded?: (stats: { unmatchedCount: number }) => void;
}) {
  const [stats, setStats] = useState<SummaryStats>({
    totalPaid: 0,
    outstanding: 0,
    unmatchedCount: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch general summary
        const summaryRes = await fetch('/api/dashboard/summary');
        const summaryData = await summaryRes.json();

        // Fetch unmatched count
        const reconcileRes = await fetch('/api/reconcile');
        const reconcileData = await reconcileRes.json();

        const newStats = {
          totalPaid: summaryData.totalPaid || 0,
          outstanding: summaryData.outstanding || 0,
          unmatchedCount: reconcileData.payments?.length || 0,
          loading: false
        };

        setStats(newStats);
        if (onStatsLoaded) {
          onStatsLoaded({ unmatchedCount: newStats.unmatchedCount });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [onStatsLoaded]);

  if (stats.loading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-line bg-white"
          />
        ))}
      </div>
    );
  }

  const expectedRevenue = stats.totalPaid + stats.outstanding;
  const collectionRate = expectedRevenue > 0 ? (stats.totalPaid / expectedRevenue) * 100 : 0;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total Collected */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted"><span className="h-2 w-2 rounded-full bg-paid-solid" />Total Collected</h3>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-muted">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        <p className="font-mono text-2xl font-semibold tabular-nums text-paid">{formatCurrency(stats.totalPaid)}</p>
        <p className="mt-2 text-xs text-muted">{Math.round(collectionRate)}% of total expected revenue</p>
      </div>

      {/* Outstanding */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Outstanding</h3>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-muted">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
        </div>
        <p className="font-mono text-2xl font-semibold tabular-nums text-ink">{formatCurrency(stats.outstanding)}</p>
        <p className="mt-2 text-xs text-muted">Balance still to be collected this season</p>
      </div>

      {/* Unmatched Payments Action Card */}
      <button
        type="button"
        onClick={onUnmatchedClick}
        disabled={!onUnmatchedClick}
        className={`group relative rounded-2xl border p-5 text-left transition-all duration-200 ${
          stats.unmatchedCount > 0 
            ? 'border-flag-line bg-flag-soft hover:border-flag-solid'
            : 'border-line bg-white'
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className={`text-xs font-semibold uppercase tracking-[0.2em] ${stats.unmatchedCount > 0 ? 'text-flag' : 'text-muted'}`}>
            Unmatched Payments
          </h3>
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${stats.unmatchedCount > 0 ? 'bg-flag-solid text-ink' : 'bg-canvas text-ink'}`}>
            <span className="text-sm font-bold">{stats.unmatchedCount}</span>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className={`text-sm ${stats.unmatchedCount > 0 ? 'text-flag' : 'text-muted'}`}>
            {stats.unmatchedCount > 0 
              ? 'Requires attention' 
              : 'All caught up'}
          </p>
          {stats.unmatchedCount > 0 && (
            <span className="text-flag transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
