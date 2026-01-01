'use client';

import { useEffect, useState } from 'react';

interface SummaryStats {
  totalPaid: number;
  outstanding: number;
  unmatchedCount: number;
  loading: boolean;
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-800 rounded-xl border border-gray-700" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Total Collected */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Collected</h3>
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-bold text-white">
          ${stats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Outstanding */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Outstanding</h3>
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-bold text-white">
          ${stats.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Unmatched Payments Action Card */}
      <div 
        onClick={onUnmatchedClick}
        className={`relative p-5 rounded-xl border shadow-lg transition-all duration-200 cursor-pointer group ${
          stats.unmatchedCount > 0 
            ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-500/50 hover:border-blue-400' 
            : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-sm font-medium uppercase tracking-wider ${stats.unmatchedCount > 0 ? 'text-blue-300' : 'text-gray-400'}`}>
            Unmatched Payments
          </h3>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stats.unmatchedCount > 0 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
            <span className="font-bold text-sm">{stats.unmatchedCount}</span>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className={`text-sm ${stats.unmatchedCount > 0 ? 'text-blue-200' : 'text-gray-400'}`}>
            {stats.unmatchedCount > 0 
              ? 'Requires attention' 
              : 'All caught up'}
          </p>
          {stats.unmatchedCount > 0 && (
            <span className="text-blue-400 group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
