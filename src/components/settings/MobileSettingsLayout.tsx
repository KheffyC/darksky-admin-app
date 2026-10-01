'use client';

import React from 'react';
import Link from 'next/link';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';
import { JotformIntegrationSettings } from '@/components/JotformIntegrationSettings';
import { AdminUtilities } from '@/components/AdminUtilities';
import { PaymentScheduleManager } from '@/components/PaymentScheduleManager';
import { CSVExportButton } from '@/components/CSVExportButton';

type SettingsState = {
  organizationName: string;
  season: string;
  defaultTuition: number;
  paymentDueDate: string;
  emailNotifications: boolean;
  autoReconcile: boolean;
};

type MobileSettingsLayoutProps = {
  settings: SettingsState;
  saved: boolean;
  loading: boolean;
  onOpenSeasonModal: () => void;
  onOpenImportHistoryModal: () => void;
  onSave: () => void;
  onReset: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prepareLedgerCSVData: () => any[];
};

export function MobileSettingsLayout({
  settings,
  saved,
  loading,
  onOpenSeasonModal,
  onOpenImportHistoryModal,
  onSave,
  onReset,
  onChange,
  prepareLedgerCSVData,
}: MobileSettingsLayoutProps) {
  return (
    <div className="pb-28 pt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
        <p className="text-neutral-300">{settings.organizationName}</p>
      </div>

      {saved && (
        <div className="mb-5 bg-gradient-to-r from-paid-soft to-paid-soft border border-paid-line text-paid-line px-4 py-3 rounded-xl text-sm">
          Settings saved successfully.
        </div>
      )}

      <div className="space-y-5">
        <section className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Active Season</h2>
              <p className="text-sm text-neutral-400">Controls app-wide member and payment views</p>
            </div>
            <button
              onClick={onOpenSeasonModal}
              className="px-3 py-2 bg-white/5 border border-white/10 text-neutral-300 rounded-lg text-sm font-medium"
            >
              Change
            </button>
          </div>
          <div className="inline-flex items-center px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-neutral-300 font-medium text-sm">Season: {settings.season}</span>
          </div>
        </section>

        <section className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 p-5">
          <h2 className="text-lg font-semibold text-white mb-1">Tuition & Payments</h2>
          <p className="text-sm text-neutral-400 mb-4">Default values for tuition and due date</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Default Tuition Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
                <input
                  type="number"
                  name="defaultTuition"
                  value={settings.defaultTuition}
                  onChange={onChange}
                  className="w-full pl-8 pr-4 py-3 border border-neutral-600 rounded-xl bg-neutral-700 text-white focus:ring-2 focus:ring-ink/10 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Payment Due Date</label>
              <input
                type="date"
                name="paymentDueDate"
                value={settings.paymentDueDate}
                onChange={onChange}
                className="w-full px-4 py-3 border border-neutral-600 rounded-xl bg-neutral-700 text-white focus:ring-2 focus:ring-ink/10 focus:border-transparent"
              />
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-700 bg-gradient-to-r from-flag-soft to-neutral-800">
            <h2 className="text-lg font-semibold text-white">Payment Schedules</h2>
            <p className="text-sm text-neutral-400 mt-1">Manage due dates and amounts</p>
          </div>
          <div className="p-5">
            <PaymentScheduleManager />
          </div>
        </section>

        <section className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-700 bg-gradient-to-r from-paid-soft to-neutral-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Jotform Integration</h2>
                <p className="text-sm text-neutral-400 mt-1">Sync registration submissions</p>
              </div>
              <button
                onClick={onOpenImportHistoryModal}
                className="text-neutral-300 hover:text-white text-xs font-medium underline"
              >
                History
              </button>
            </div>
          </div>
          <div className="p-5">
            <JotformIntegrationSettings onSave={onSave} />
          </div>
        </section>

        <PermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
          <section className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 p-5">
            <h2 className="text-lg font-semibold text-white mb-1">User Management</h2>
            <p className="text-sm text-neutral-400 mb-4">Manage access and roles.</p>
            <Link
              href="/dashboard/users"
              className="inline-flex px-4 py-2 bg-white hover:bg-neutral-200 text-ink rounded-lg font-medium text-sm"
            >
              Manage Users
            </Link>
          </section>
        </PermissionGuard>

        <PermissionGuard permission={PERMISSIONS.VIEW_FINANCIAL_REPORTS}>
          <section className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700 p-5">
            <h2 className="text-lg font-semibold text-white mb-1">Reporting</h2>
            <p className="text-sm text-neutral-400 mb-4">Export member ledger data.</p>
            <CSVExportButton
              data={prepareLedgerCSVData()}
              filename="member_ledger.csv"
              className="inline-flex px-4 py-2 bg-white hover:bg-neutral-200 text-ink rounded-lg font-medium text-sm"
            >
              Export CSV
            </CSVExportButton>
          </section>
        </PermissionGuard>

        <section className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl border border-behind-line overflow-hidden">
          <div className="px-5 py-4 border-b border-behind-line bg-gradient-to-r from-behind-soft to-neutral-800">
            <h2 className="text-lg font-semibold text-white">Admin Utilities</h2>
            <p className="text-sm text-behind-line mt-1">Use with caution</p>
          </div>
          <div className="p-5">
            <AdminUtilities />
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-700 bg-neutral-900/95 backdrop-blur px-4 py-3 md:hidden">
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 px-4 py-3 border border-neutral-600 text-neutral-300 rounded-lg font-semibold text-sm"
          >
            Reset
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-white text-ink rounded-lg font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
