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

  const sections: Array<{ key: SettingsSection; label: string }> = [
    { key: 'tuition', label: 'Tuition' },
    { key: 'schedules', label: 'Schedules' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'users', label: 'Users' },
    { key: 'reporting', label: 'Reporting' },
    { key: 'admin', label: 'Admin Utilities' },
  ];

  useEffect(() => {
    const sectionFromQuery = searchParams.get('section');
    const validSection = sections.find((section) => section.key === sectionFromQuery);

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

  const panelClassName = 'overflow-hidden rounded-xl border border-gray-700 bg-gray-900/80
  const panelHeaderClassName = 'border-b border-gray-700 px-6 py-5';
  const panelBodyClassName = 'p-6';

  const renderActiveSection = () => {
    if (activeSection === 'tuition') {
      return (
        <div className="space-y-6">
          <div className={panelClassName}>
            <div className={`${panelHeaderClassName} bg-gradient-to-r from-blue-900/50 to-gray-800`}>
              <h2 className="text-2xl font-semibold text-white">Global Tuition (Season-wide)</h2>
              <p className="mt-1 text-gray-300">These values are typically updated once per season.</p>
            </div>
            <div className={panelBodyClassName}>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">Default Tuition Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-400">$</span>
                    <input
                      type="number"
                      name="defaultTuition"
                      value={settings.defaultTuition}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-600 bg-gray-700 py-3 pl-8 pr-4 text-white transition-all duration-200 focus:border-transparent focus:bg-gray-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">Payment Due Date</label>
                  <input
                    type="date"
                    name="paymentDueDate"
                    value={settings.paymentDueDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white transition-all duration-200 focus:border-transparent focus:bg-gray-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={handleReset}
              className="rounded-xl border-2 border-gray-600 px-8 py-3 font-semibold text-gray-300 transition-all duration-200 hover:border-gray-500 hover:bg-gray-700/50"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className={`${panelHeaderClassName} bg-gradient-to-r from-orange-900/50 to-gray-800`}>
            <h2 className="text-2xl font-semibold text-white">Payment Schedules</h2>
            <p className="mt-1 text-gray-300">Manage payment due dates and amounts for different seasons.</p>
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
          <div className={`${panelHeaderClassName} bg-gradient-to-r from-green-900/50 to-gray-800`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Jotform Integration</h2>
                <p className="mt-1 text-gray-300">Connect and sync with Jotform submissions.</p>
              </div>
              <button
                onClick={() => setShowImportHistoryModal(true)}
                className="text-sm font-medium text-blue-400 underline transition-colors duration-200 hover:text-blue-300"
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
            <div className={`${panelHeaderClassName} bg-gradient-to-r from-purple-900/50 to-gray-800`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">User Management</h2>
                  <p className="mt-1 text-gray-300">Manage system users and permissions.</p>
                </div>
                <Link
                  href="/dashboard/users"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                >
                  Manage Users
                </Link>
              </div>
            </div>
            <div className={panelBodyClassName}>
              <p className="text-gray-300">Access the user management dashboard to add, remove, or modify users and roles.</p>
            </div>
          </div>
        </PermissionGuard>
      );
    }

    if (activeSection === 'reporting') {
      return (
        <PermissionGuard permission={PERMISSIONS.VIEW_FINANCIAL_REPORTS}>
          <div className={panelClassName}>
            <div className={`${panelHeaderClassName} bg-gradient-to-r from-teal-900/50 to-gray-800`}>
              <h2 className="text-2xl font-semibold text-white">Reporting</h2>
              <p className="mt-1 text-gray-300">Export financial and member data.</p>
            </div>
            <div className={panelBodyClassName}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-white">Member Ledger Export</h3>
                  <p className="text-gray-300">Download the full member ledger including payment history and balances.</p>
                </div>
                <CSVExportButton
                  data={prepareLedgerCSVData()}
                  filename="member_ledger.csv"
                  className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-teal-700"
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
        <div className={`${panelHeaderClassName} bg-gradient-to-r from-red-900/50 to-gray-800`}>
          <h2 className="text-2xl font-semibold text-white">Admin Utilities</h2>
          <p className="mt-1 text-gray-300">Dangerous operations, use with caution.</p>
        </div>
        <div className={panelBodyClassName}>
          <AdminUtilities />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full py-8 sm:py-10">
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-700 bg-gray-900/80 px-6 py-5
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-300">Settings</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">Settings</h1>
              <div className="flex items-center gap-4">
                <p className="text-base text-gray-300">{settings.organizationName}</p>
                <div className="flex items-center gap-2">
                  <div className="rounded-md border border-blue-500/30 bg-blue-600/20 px-3 py-1">
                    <span className="text-blue-300 font-medium text-sm">Season: {settings.season}</span>
                  </div>
                  <button
                    onClick={() => setShowSeasonModal(true)}
                    className="text-sm font-medium text-blue-400 underline transition-colors duration-200 hover:text-blue-300"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
          {saved && (
            <div className="mt-5 rounded-lg border border-green-700 bg-gradient-to-r from-green-900/50 to-emerald-900/50 px-4 py-3 text-green-200
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Settings saved successfully!
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="lg:sticky lg:top-24 lg:w-64 lg:shrink-0">
            <div className="rounded-xl border border-gray-700 bg-gray-900/90 p-4
              <p className="px-2 pb-3 text-xs uppercase tracking-wider text-gray-400">Sections</p>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
                {sections.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => handleSectionChange(section.key)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap lg:w-full lg:text-left ${
                      activeSection === section.key
                        ? 'bg-blue-600/20 text-blue-200 ring-1 ring-blue-500/40'
                        : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-700 to-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Change Season</h2>
                  <button
                    onClick={() => setShowSeasonModal(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
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
                      <label className="block text-sm font-semibold text-white">
                        Select Active Season
                      </label>
                      {!isDesktopLayout && (
                        <select
                          value={currentSeasonId}
                          onChange={(e) => handleSeasonSwitch(e.target.value)}
                          disabled={switchingSeasons}
                          className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white focus:bg-gray-600"
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
                                    ? 'bg-blue-600/25 border-blue-500/40 text-blue-200 cursor-default'
                                    : 'bg-gray-700/60 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500'
                                } disabled:opacity-70 disabled:cursor-not-allowed`}
                              >
                                <span className="font-medium">{season.season}</span>
                                {isCurrent ? <span className="ml-2 text-xs text-blue-300">Current</span> : null}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <p className="text-amber-300 font-medium text-sm">Important</p>
                          <p className="text-amber-200 text-sm mt-1">
                            Switching seasons will change which members and data are displayed throughout the entire application.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {switchingSeasons && (
                      <div className="flex items-center justify-center text-blue-400 py-2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Switching season...
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowSeasonModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-blue-900/50 to-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Import History</h2>
                    <p className="text-gray-300 text-sm mt-1">View recent data import operations</p>
                  </div>
                  <button
                    onClick={() => setShowImportHistoryModal(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
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
