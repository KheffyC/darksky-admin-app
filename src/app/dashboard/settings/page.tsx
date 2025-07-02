'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    organizationName: 'Dark Sky',
    season: '2024-2025',
    defaultTuition: 1000,
    paymentDueDate: '',
    emailNotifications: true,
    autoReconcile: false,
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Here you would typically save to an API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Settings</h1>
          <p className="text-xl text-gray-300">Manage your organization and payment preferences</p>
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
          {/* Organization Settings */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-gray-700 to-gray-800">
              <h2 className="text-2xl font-semibold text-white">Organization</h2>
              <p className="text-gray-300 mt-1">Basic information about your organization</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    value={settings.organizationName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white focus:bg-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Current Season
                  </label>
                  <input
                    type="text"
                    name="season"
                    value={settings.season}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white focus:bg-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>

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
                
                <div className="flex items-start justify-between p-6 bg-gray-700/50 rounded-xl border border-gray-600">
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
                </div>
              </div>
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
      </div>
    </div>
  );
}
