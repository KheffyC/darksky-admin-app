'use client';
import { useState, useEffect } from 'react';
import { type PaymentSchedule, type NewPaymentSchedule } from '@/db/schema';

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
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    dueDate: '',
    amount: '',
    season: settings.season,
  });

  // Load payment schedules on component mount
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const response = await fetch('/api/payment-schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Failed to load payment schedules:', error);
    } finally {
      setSchedulesLoading(false);
    }
  };

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

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSchedule(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.name || !newSchedule.dueDate || !newSchedule.amount || !newSchedule.season) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/payment-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSchedule,
          amount: parseFloat(newSchedule.amount),
        }),
      });

      if (response.ok) {
        await loadSchedules();
        setNewSchedule({
          name: '',
          description: '',
          dueDate: '',
          amount: '',
          season: settings.season,
        });
        setShowAddSchedule(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create payment schedule');
      }
    } catch (error) {
      console.error('Failed to add payment schedule:', error);
      alert('Failed to create payment schedule');
    }
  };

  const handleToggleSchedule = async (scheduleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/payment-schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Settings</h1>
          <p className="text-lg sm:text-xl text-gray-300">Manage your organization and payment preferences</p>
          {saved && (
            <div className="mt-6 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-700 text-green-200 px-4 sm:px-6 py-4 rounded-xl shadow-sm">
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
            <div className="px-4 sm:px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-gray-700 to-gray-800">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">Organization</h2>
              <p className="text-gray-300 mt-1 text-sm sm:text-base">Basic information about your organization</p>
            </div>
            <div className="p-4 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
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

          {/* Payment Schedules */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-4 sm:px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/50 to-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-white">Payment Schedules</h2>
                  <p className="text-gray-300 mt-1 text-sm sm:text-base">Manage tuition payment periods and due dates</p>
                </div>
                <button
                  onClick={() => setShowAddSchedule(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Schedule
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-8">
              {schedulesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center text-gray-400">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading payment schedules...
                  </div>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a4 4 0 118 0v4m-4 4v6m0-6a4 4 0 014 4v2m0 0H8m4 0h4" />
                    </svg>
                    <p className="text-lg">No payment schedules configured</p>
                    <p className="text-sm text-gray-500">Add your first payment schedule to get started</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`p-4 sm:p-6 rounded-xl border transition-all duration-200 ${
                        schedule.isActive
                          ? 'bg-gray-700/50 border-gray-600'
                          : 'bg-gray-800/50 border-gray-700 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{schedule.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              schedule.isActive
                                ? 'bg-green-900/50 text-green-300 border border-green-700'
                                : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                            }`}>
                              {schedule.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300 space-y-1">
                            <p><span className="text-gray-400">Due Date:</span> {formatDate(schedule.dueDate)}</p>
                            <p><span className="text-gray-400">Amount:</span> {formatCurrency(schedule.amount)}</p>
                            <p><span className="text-gray-400">Season:</span> {schedule.season}</p>
                            {schedule.description && (
                              <p><span className="text-gray-400">Description:</span> {schedule.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleSchedule(schedule.id, schedule.isActive)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                              schedule.isActive
                                ? 'bg-red-600/20 text-red-300 border border-red-600/50 hover:bg-red-600/30'
                                : 'bg-green-600/20 text-green-300 border border-green-600/50 hover:bg-green-600/30'
                            }`}
                          >
                            {schedule.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Schedule Modal */}
              {showAddSchedule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-6">Add Payment Schedule</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Schedule Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={newSchedule.name}
                          onChange={handleScheduleChange}
                          placeholder="e.g., Fall 2024 Tuition"
                          className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={newSchedule.description}
                          onChange={handleScheduleChange}
                          placeholder="Optional description"
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Due Date <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="date"
                            name="dueDate"
                            value={newSchedule.dueDate}
                            onChange={handleScheduleChange}
                            className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Amount <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                            <input
                              type="number"
                              name="amount"
                              value={newSchedule.amount}
                              onChange={handleScheduleChange}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="w-full pl-8 pr-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Season <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="season"
                          value={newSchedule.season}
                          onChange={handleScheduleChange}
                          placeholder="e.g., 2024-2025"
                          className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowAddSchedule(false)}
                        className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700/50 transition-all duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddSchedule}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
                      >
                        Add Schedule
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tuition Settings */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-4 sm:px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-purple-900/50 to-gray-800">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">Default Tuition Settings</h2>
              <p className="text-gray-300 mt-1 text-sm sm:text-base">Configure default payment amounts for new members</p>
            </div>
            <div className="p-4 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
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
            <div className="px-4 sm:px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-purple-900/50 to-gray-800">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">Automation</h2>
              <p className="text-gray-300 mt-1 text-sm sm:text-base">Configure automated features and notifications</p>
            </div>
            <div className="p-4 sm:p-8">
              <div className="space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 sm:p-6 bg-gray-700/50 rounded-xl border border-gray-600 gap-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                      Email Notifications
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                      Automatically send email notifications for payment reminders, confirmations, and important updates to members and administrators.
                    </p>
                  </div>
                  <div className="sm:ml-6 flex-shrink-0">
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
                
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 sm:p-6 bg-gray-700/50 rounded-xl border border-gray-600 gap-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                      Auto-Reconcile Payments
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                      Automatically match incoming payments with member accounts based on name similarity and payment amounts for faster processing.
                    </p>
                  </div>
                  <div className="sm:ml-6 flex-shrink-0">
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
