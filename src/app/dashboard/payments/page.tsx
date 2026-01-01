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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Financial Health Bar */}
      <FinancialSummary 
        onUnmatchedClick={() => setActiveTab('unmatched')}
        onStatsLoaded={handleStatsLoaded}
      />

      {/* Sticky Tab Navigation */}
      <div className="sticky top-0 z-30 pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="absolute inset-0  pointer-events-none" />
        <div className="relative bg-gray-900/80 backdrop-blur-xl p-1.5 rounded-xl flex shadow-2xl border border-gray-800/50">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative ${
              activeTab === 'ledger'
                ? 'bg-gray-800 text-white shadow-lg ring-1 ring-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            Member Ledger
          </button>
          <button
            onClick={() => setActiveTab('unmatched')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative flex items-center justify-center gap-2 ${
              activeTab === 'unmatched'
                ? 'bg-gray-800 text-white shadow-lg ring-1 ring-white/10'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            Reconciliation
            {unmatchedCount > 0 && (
              <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                activeTab === 'unmatched' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {unmatchedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px] mt-2">
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
