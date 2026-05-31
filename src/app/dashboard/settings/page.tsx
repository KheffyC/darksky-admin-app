'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';
import { JotformIntegrationSettings } from '@/components/JotformIntegrationSettings';
import { AdminUtilities } from '@/components/AdminUtilities';
import { ImportHistory } from '@/components/ImportHistory';
import { PaymentScheduleManager } from '@/components/PaymentScheduleManager';
import { CSVExportButton } from '@/components/CSVExportButton';

type SettingsSection = 'tuition' | 'schedules' | 'integrations' | 'users' | 'reporting' | 'admin';

const SETTINGS_SECTIONS: Array<{ key: SettingsSection; label: string }> = [
  { key: 'tuition', label: 'Tuition' },
  { key: 'schedules', label: 'Schedules' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'users', label: 'Users' },
  { key: 'reporting', label: 'Reporting' },
  { key: 'admin', label: 'Admin Utilities' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    organizationName: 'Dark Sky',
    season: '2024-2025',
    defaultTuition: 1000,
    paymentDueDate: '',
    emailNotifications: true,
    autoReconcile: false,
  });

  const [allSeasons, setAllSeasons] = useState<any[]>([]);
  const [currentSeasonId, setCurrentSeasonId] = useState<string>('');
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [switchingSeasons, setSwitchingSeasons] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [showImportHistoryModal, setShowImportHistoryModal] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('tuition');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load settings and all seasons on component mount
  useEffect(() => {
    loadSettings();
    loadAllSeasons();
    loadLedgerData();
  }, []);

  useEffect(() => {
    const updateLayout = () => {
      setIsDesktopLayout(window.innerWidth >= 1024);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);

    return () => {
      window.removeEventListener('resize', updateLayout);
    };
  }, []);

  const loadLedgerData = async () => {
    try {
      const response = await fetch('/api/members/ledger');
      if (response.ok) {
        const data = await response.json();
        setLedgerData(data);
      }
    } catch (error) {
      console.error('Failed to load ledger data:', error);
    }
  };

  const prepareLedgerCSVData = () => {
    if (!ledgerData || ledgerData.length === 0) return [];
    
    return ledgerData.map((member: any) => ({
      'Member Name': member.name || 'N/A',
      'Section': member.section || 'N/A',
      'Total Paid': `$${(member.totalPaid || 0).toFixed(2)}`,
      'Outstanding Balance': `$${(member.remaining || 0).toFixed(2)}`,
      'Status': member.status || 'unknown',
      'Late Payments': member.latePaymentsCount || 0
    }));
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadAllSeasons = async () => {
    try {
      const response = await fetch('/api/settings/all-seasons');
      if (response.ok) {
        const data = await response.json();
        setAllSeasons(data);
        const current = data.find((s: any) => s.currentSeason);
        if (current) {
          setCurrentSeasonId(current.id);
        }
      }
    } catch (error) {
      console.error('Failed to load all seasons:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonSwitch = async (seasonId: string) => {
    setSwitchingSeasons(true);
    try {
      const response = await fetch('/api/settings/switch-season', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seasonId }),
      });

      if (response.ok) {
        setCurrentSeasonId(seasonId);
        loadSettings(); // Reload settings to get updated current season
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setShowSeasonModal(false); // Close the modal on success
      } else {
        throw new Error('Failed to switch season');
      }
    } catch (error) {
      console.error('Failed to switch season:', error);
    } finally {
      setSwitchingSeasons(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleReset = () => {
    window.location.reload();
  };

  useEffect(() => {
    const sectionFromQuery = searchParams.get('section');
    const validSection = SETTINGS_SECTIONS.find((section) => section.key === sectionFromQuery);

    if (validSection) {
      setActiveSection(validSection.key);
      return;
    }

    setActiveSection('tuition');
  }, [searchParams]);

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);

    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const panelClassName = 'overflow-hidden rounded-2xl border border-[#d6dde5] bg-white';
  const panelHeaderClassName = 'border-b border-[#d6dde5] px-6 py-5';
  const panelBodyClassName = 'p-6';

  const renderActiveSection = () => {
    if (activeSection === 'tuition') {
      return (
        <div className="space-y-6">
          <div className={panelClassName}>
            <div className={`${panelHeaderClassName} bg-[#f7f9fb]`}>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">Global Tuition (Season-wide)</h2>
              <p className="mt-1 text-[#788896]">These values are typically updated once per season.</p>
            </div>
            <div className={panelBodyClassName}>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black">Default Tuition Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-[#788896]">$</span>
                    <input
                      type="number"
                      name="defaultTuition"
                      value={settings.defaultTuition}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-[#d6dde5] bg-white py-3 pl-8 pr-4 text-black transition-all duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black">Payment Due Date</label>
                  <input
                    type="date"
                    name="paymentDueDate"
                    value={settings.paymentDueDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#d6dde5] bg-white px-4 py-3 text-black transition-all duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={handleReset}
              className="rounded-xl border border-[#d6dde5] bg-white px-8 py-3 font-semibold text-black transition-all duration-200 hover:bg-[#f7f9fb]"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-xl border border-[#f38d68] bg-[#f38d68] px-8 py-3 font-semibold text-black transition-all duration-200 hover:bg-[#f5a07f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Tuition Settings'}
            </button>
          </div>
        </div>
      );
    }

    if (activeSection === 'schedules') {
      return (
        <div className={panelClassName}>
          <div className={`${panelHeaderClassName} bg-[#fff5f0]`}>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">Payment Schedules</h2>
            <p className="mt-1 text-[#788896]">Manage payment due dates and amounts for different seasons.</p>
          </div>
          <div className={panelBodyClassName}>
            <PaymentScheduleManager />
          </div>
        </div>
      );
    }

    if (activeSection === 'integrations') {
      return (
        <div className={panelClassName}>
          <div className={`${panelHeaderClassName} bg-[#f2faf6]`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">Jotform Integration</h2>
                <p className="mt-1 text-[#788896]">Connect and sync with Jotform submissions.</p>
              </div>
              <button
                onClick={() => setShowImportHistoryModal(true)}
                className="text-sm font-medium text-[#0D47A1] underline transition-colors duration-200 hover:text-black"
              >
                View Import History
              </button>
            </div>
          </div>
          <div className={panelBodyClassName}>
            <JotformIntegrationSettings onSave={() => setSaved(true)} />
          </div>
        </div>
      );
    }

    if (activeSection === 'users') {
      return (
        <PermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
          <div className={panelClassName}>
            <div className={`${panelHeaderClassName} bg-[#f4f5fb]`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">User Management</h2>
                  <p className="mt-1 text-[#788896]">Manage system users and permissions.</p>
                </div>
                <Link
                  href="/dashboard/users"
                  className="rounded-lg border border-[#d6dde5] bg-white px-4 py-2 text-sm font-medium text-black transition-colors duration-200 hover:bg-[#f7f9fb]"
                >
                  Manage Users
                </Link>
              </div>
            </div>
            <div className={panelBodyClassName}>
              <p className="text-[#788896]">Access the user management dashboard to add, remove, or modify users and roles.</p>
            </div>
          </div>
        </PermissionGuard>
      );
    }

    if (activeSection === 'reporting') {
      return (
        <PermissionGuard permission={PERMISSIONS.VIEW_FINANCIAL_REPORTS}>
          <div className={panelClassName}>
            <div className={`${panelHeaderClassName} bg-[#f0fbfb]`}>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">Reporting</h2>
              <p className="mt-1 text-[#788896]">Export financial and member data.</p>
            </div>
            <div className={panelBodyClassName}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-black">Member Ledger Export</h3>
                  <p className="text-[#788896]">Download the full member ledger including payment history and balances.</p>
                </div>
                <CSVExportButton
                  data={prepareLedgerCSVData()}
                  filename="member_ledger.csv"
                  className="flex items-center gap-2 rounded-xl border border-emerald-400 bg-emerald-100 px-6 py-3 font-semibold text-emerald-900 transition-colors duration-200 hover:bg-emerald-200"
                >
                  Export CSV
                </CSVExportButton>
              </div>
            </div>
          </div>
        </PermissionGuard>
      );
    }

    return (
      <div className={panelClassName}>
        <div className={`${panelHeaderClassName} bg-[#fff2f2]`}>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">Admin Utilities</h2>
          <p className="mt-1 text-[#788896]">Dangerous operations, use with caution.</p>
        </div>
        <div className={panelBodyClassName}>
          <AdminUtilities />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full lg:py-2 sm:py-10">
      <div className="space-y-6">
        <div className="py-2">
          <div className="mb-3 flex items-center gap-2 text-sm text-[#788896]">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-black">Settings</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-[-0.03em] text-black">Settings</h1>
              <div className="flex items-center gap-4">
                <p className="text-base text-[#788896]">{settings.organizationName}</p>
                <div className="flex items-center gap-2">
                  <div className="rounded-md border border-[#d6dde5] bg-[#f7f9fb] px-3 py-1">
                    <span className="text-sm font-medium text-black">Season: {settings.season}</span>
                  </div>
                  <button
                    onClick={() => setShowSeasonModal(true)}
                    className="text-sm font-medium text-[#0D47A1] underline transition-colors duration-200 hover:text-black"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
          {saved && (
            <div className="mt-5 rounded-lg border border-emerald-400 bg-emerald-100 px-4 py-3 text-emerald-900">
              <div className="flex items-center">
                <svg className="mr-3 h-5 w-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Settings saved successfully!
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="lg:sticky lg:top-24 lg:w-64 lg:shrink-0">
            <div className="rounded-xl border border-[#d6dde5] bg-white p-4">
              <p className="px-2 pb-3 text-xs uppercase tracking-[0.2em] text-[#788896]">Sections</p>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
                {SETTINGS_SECTIONS.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => handleSectionChange(section.key)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap lg:w-full lg:text-left ${
                      activeSection === section.key
                        ? 'border border-[#f38d68] bg-[#fff5f0] text-black'
                        : 'border border-transparent text-[#788896] hover:border-[#d6dde5] hover:bg-[#f7f9fb] hover:text-black'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">{renderActiveSection()}</div>
        </div>
      </div>

        {/* Season Management Modal */}
        {showSeasonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-[#d6dde5] bg-white">
              <div className="border-b border-[#d6dde5] bg-[#f7f9fb] px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-black">Change Season</h2>
                  <button
                    onClick={() => setShowSeasonModal(false)}
                    className="text-[#788896] transition-colors duration-200 hover:text-black"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {allSeasons.length > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-black">
                        Select Active Season
                      </label>
                      {!isDesktopLayout && (
                        <select
                          value={currentSeasonId}
                          onChange={(e) => handleSeasonSwitch(e.target.value)}
                          disabled={switchingSeasons}
                          className="w-full rounded-xl border border-[#d6dde5] bg-white px-4 py-3 text-black transition-all duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]"
                        >
                          <option value="">Select a season...</option>
                          {allSeasons.map((season) => (
                            <option key={season.id} value={season.id}>
                              {season.season} {season.currentSeason ? '(Current)' : ''}
                            </option>
                          ))}
                        </select>
                      )}

                      {isDesktopLayout && (
                      <div className="space-y-2">
                          {allSeasons.map((season) => {
                            const isCurrent = season.id === currentSeasonId;

                            return (
                              <button
                                key={season.id}
                                onClick={() => handleSeasonSwitch(season.id)}
                                disabled={switchingSeasons || isCurrent}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                                  isCurrent
                                    ? 'cursor-default border-[#f38d68] bg-[#fff5f0] text-black'
                                    : 'border-[#d6dde5] bg-white text-black hover:bg-[#f7f9fb]'
                                } disabled:opacity-70 disabled:cursor-not-allowed`}
                              >
                                <span className="font-medium">{season.season}</span>
                                {isCurrent ? <span className="ml-2 text-xs text-[#f38d68]">Current</span> : null}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border border-amber-400 bg-amber-100 p-4">
                      <div className="flex items-start">
                        <svg className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-amber-900">Important</p>
                          <p className="mt-1 text-sm text-amber-900">
                            Switching seasons will change which members and data are displayed throughout the entire application.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {switchingSeasons && (
                      <div className="flex items-center justify-center py-2 text-[#0D47A1]">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0D47A1] border-t-transparent"></div>
                        Switching season...
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowSeasonModal(false)}
                        className="flex-1 rounded-lg border border-[#d6dde5] px-4 py-2 text-black transition-all duration-200 hover:bg-[#f7f9fb]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Import History Modal */}
        {showImportHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-[#d6dde5] bg-white">
              <div className="border-b border-[#d6dde5] bg-[#f7f9fb] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-black">Import History</h2>
                    <p className="mt-1 text-sm text-[#788896]">View recent data import operations</p>
                  </div>
                  <button
                    onClick={() => setShowImportHistoryModal(false)}
                    className="text-[#788896] transition-colors duration-200 hover:text-black"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <ImportHistory />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
