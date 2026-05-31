'use client';

import { useState, useCallback } from 'react';
import LedgerView from '@/components/LedgerView';
import ReconcileView from '@/components/ReconcileView';
import { FinancialSummary } from '@/components/FinancialSummary';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'unmatched'>('ledger');
  const [unmatchedCount, setUnmatchedCount] = useState(0);

  const handleStatsLoaded = useCallback((stats: { unmatchedCount: number }) => {
    setUnmatchedCount(stats.unmatchedCount);
  }, []);

  return (
    <div className="w-full space-y-6 py-6 sm:space-y-7 sm:py-8">
      <section className="rounded-[28px] lg:p-0 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black/90">
              Payments command center
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">
                Ledger and Unmatched Transactions
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#788896] sm:text-base">
                Move between member balances and unmatched transactions with one focused workspace built for fast finance follow-up.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[#788896]">
            <span className="rounded-full border border-[#d6dde5] bg-white px-3 py-1.5">
              Active workspace: <span className="font-semibold text-black">Payments</span>
            </span>
            <span className="rounded-full border border-red-300 bg-white px-3 py-1.5 text-black">
              {unmatchedCount} unmatched transaction{unmatchedCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </section>

      {/* Financial Health Bar */}
      <FinancialSummary 
        onUnmatchedClick={() => setActiveTab('unmatched')}
        onStatsLoaded={handleStatsLoaded}
      />

      {/* Sticky Tab Navigation */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pb-4 pt-1 sm:mx-0 sm:px-0">
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative rounded-2xl border border-[#d6dde5] bg-white p-1.5">
          <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`relative flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'ledger'
                ? 'bg-emerald-300 text-black'
                : 'text-[#788896] hover:bg-[#f7f9fb] hover:text-black'
            }`}
          >
            Member Ledger
          </button>
          <button
            onClick={() => setActiveTab('unmatched')}
            className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'unmatched'
                ? 'bg-emerald-300 text-black'
                : 'text-[#788896] hover:bg-[#f7f9fb] hover:text-black'
            }`}
          >
            Reconciliation
            {unmatchedCount > 0 && (
              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                activeTab === 'unmatched' 
                  ? 'bg-red-400 text-black' 
                  : 'bg-[#eef3f8] text-black'
              }`}>
                {unmatchedCount}
              </span>
            )}
          </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-2 min-h-[600px]">
        <AnimatePresence mode="wait">
          {activeTab === 'ledger' ? (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <LedgerView />
            </motion.div>
          ) : (
            <motion.div
              key="unmatched"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ReconcileView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
