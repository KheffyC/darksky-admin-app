'use client';
import React, { useState, useEffect } from 'react';

interface PaymentSchedule {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  amount: string;
  season: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function PaymentScheduleManager() {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PaymentSchedule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    amount: '',
    season: '2024-2025',
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/payment-schedules');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        throw new Error('Failed to load payment schedules');
      }
    } catch (error) {
      console.error('Failed to load payment schedules:', error);
      setError('Failed to load payment schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const url = editingSchedule 
        ? `/api/payment-schedules/${editingSchedule.id}`
        : '/api/payment-schedules';
      
      const method = editingSchedule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (response.ok) {
        await loadSchedules(); // Reload the list
        resetForm();
        setShowForm(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingSchedule ? 'update' : 'create'} payment schedule`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (schedule: PaymentSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      dueDate: schedule.dueDate,
      amount: schedule.amount,
      season: schedule.season,
      isActive: schedule.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to deactivate this payment schedule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/payment-schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSchedules(); // Reload the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete payment schedule');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete payment schedule');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dueDate: '',
      amount: '',
      season: '2024-2025',
      isActive: true,
    });
    setEditingSchedule(null);
    setError(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Payment Schedules</h3>
          <p className="text-gray-400 text-sm">Manage payment due dates and amounts</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium text-sm"
        >
          Add Schedule
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
          <h4 className="text-lg font-semibold text-white mb-4">
            {editingSchedule ? 'Edit Payment Schedule' : 'Create New Payment Schedule'}
          </h4>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Schedule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Fall 2024 Payment"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Season *
                </label>
                <select
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2023-2024">2023-2024</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm text-gray-200">
                Schedule is active
              </label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : (editingSchedule ? 'Update Schedule' : 'Create Schedule')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No payment schedules found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-4 rounded-lg border ${
                schedule.isActive 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-800/50 border-gray-700 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-white font-semibold">{schedule.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      schedule.isActive 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                    }`}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-300">
                    <span>Due: {new Date(schedule.dueDate).toLocaleDateString()}</span>
                    <span>Amount: ${parseFloat(schedule.amount).toFixed(2)}</span>
                    <span>Season: {schedule.season}</span>
                  </div>
                  {schedule.description && (
                    <p className="text-gray-400 text-sm mt-2">{schedule.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30 transition-colors duration-200 border border-yellow-400/30"
                  >
                    Edit
                  </button>
                  {schedule.isActive && (
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="px-3 py-1 text-sm bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors duration-200 border border-red-400/30"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
