'use client';
import { useState, useEffect } from 'react';
import { JotformIntegrationSettings } from '@/components/JotformIntegrationSettings';
import { AdminUtilities } from '@/components/AdminUtilities';
import { ImportHistory } from '@/components/ImportHistory';
import { PaymentScheduleManager } from '@/components/PaymentScheduleManager';

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
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [switchingSeasons, setSwitchingSeasons] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [showImportHistoryModal, setShowImportHistoryModal] = useState(false);

  // Load settings and all seasons on component mount
  useEffect(() => {
    loadSettings();
    loadAllSeasons();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{settings.organizationName}</h1>
              <div className="flex items-center gap-4">
                <p className="text-xl text-gray-300">Settings & Configuration</p>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                    <span className="text-blue-300 font-medium text-sm">Season: {settings.season}</span>
                  </div>
                  <button
                    onClick={() => setShowSeasonModal(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200 underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
          {saved && (
            <div className="mt-6 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-700 text-green-200 px-6 py-4 rounded-xl shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Settings saved successfully!
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Tuition Settings */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/50 to-gray-800">
              <h2 className="text-2xl font-semibold text-white">Tuition & Payments</h2>
              <p className="text-gray-300 mt-1">Configure payment amounts and due dates</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Default Tuition Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">$</span>
                    <input
                      type="number"
                      name="defaultTuition"
                      value={settings.defaultTuition}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white focus:bg-gray-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    name="paymentDueDate"
                    value={settings.paymentDueDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white focus:bg-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Automation Settings */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-purple-900/50 to-gray-800">
              <h2 className="text-2xl font-semibold text-white">Automation</h2>
              <p className="text-gray-300 mt-1">Configure automated features and notifications</p>
            </div>
            <div className="p-8">
              <div className="space-y-8">
                <div className="flex items-start justify-between p-6 bg-gray-700/50 rounded-xl border border-gray-600">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Email Notifications
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      Automatically send email notifications for payment reminders, confirmations, and important updates to members and administrators.
                    </p>
                  </div>
                  <div className="ml-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={settings.emailNotifications}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                {/* TODO: MIGHT BE BENEFICIAL AFTER MVP WORKS FOR A YEAR. */}
                
                {/* <div className="flex items-start justify-between p-6 bg-gray-700/50 rounded-xl border border-gray-600">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Auto-Reconcile Payments
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      Automatically match incoming payments with member accounts based on name similarity and payment amounts for faster processing.
                    </p>
                  </div>
                  <div className="ml-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="autoReconcile"
                        checked={settings.autoReconcile}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div> */}
              </div>
            </div>
          </div>

          {/* Payment Schedule Management */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-orange-900/50 to-gray-800">
              <h2 className="text-2xl font-semibold text-white">Payment Schedules</h2>
              <p className="text-gray-300 mt-1">Manage payment due dates and amounts for different seasons</p>
            </div>
            <div className="p-8">
              <PaymentScheduleManager />
            </div>
          </div>

          {/* Jotform Integration Settings */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-green-900/50 to-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Jotform Integration</h2>
                  <p className="text-gray-300 mt-1">Connect and sync with Jotform submissions</p>
                </div>
                <button
                  onClick={() => setShowImportHistoryModal(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200 underline"
                >
                  View Import History
                </button>
              </div>
            </div>
            <div className="p-8">
              <JotformIntegrationSettings onSave={() => setSaved(true)} />
            </div>
          </div>

          {/* Admin Utilities */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-red-900/50 to-gray-800">
              <h2 className="text-2xl font-semibold text-white">Admin Utilities</h2>
              <p className="text-gray-300 mt-1">Dangerous operations - use with caution</p>
            </div>
            <div className="p-8">
              <AdminUtilities />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-4 pt-8">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 border-2 border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200 font-semibold"
            >
              Reset Changes
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>

        {/* Season Management Modal */}
        {showSeasonModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 w-full max-w-md">
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
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 w-full max-w-4xl max-h-[80vh] overflow-hidden">
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
    </div>
  );
}
