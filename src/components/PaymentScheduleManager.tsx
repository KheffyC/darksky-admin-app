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
  const [availableSeasons, setAvailableSeasons] = useState<any[]>([]);
  const [currentSeason, setCurrentSeason] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PaymentSchedule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    amount: '',
    season: '',
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([loadSchedules(), loadSeasons()]);
    };
    
    loadInitialData();
  }, []);

  const loadSeasons = async () => {
    try {
      const response = await fetch('/api/settings/all-seasons');
      if (response.ok) {
        const data = await response.json();
        setAvailableSeasons(data);
        
        // Find current season and set as default
        const current = data.find((s: any) => s.currentSeason);
        const defaultSeason = current ? current.season : (data.length > 0 ? data[0].season : '');
        
        if (defaultSeason) {
          setCurrentSeason(defaultSeason);
          setFormData(prev => ({ ...prev, season: defaultSeason }));
        }
      } else {
        console.error('Failed to load seasons');
        // Fallback to a reasonable default if API fails
        setAvailableSeasons([{ id: '1', season: '2026', currentSeason: true }]);
        setCurrentSeason('2026');
        setFormData(prev => ({ ...prev, season: '2026' }));
      }
    } catch (error) {
      console.error('Failed to load seasons:', error);
      // Fallback to a reasonable default if API fails
      setAvailableSeasons([{ id: '1', season: '2026', currentSeason: true }]);
      setCurrentSeason('2026');
      setFormData(prev => ({ ...prev, season: '2026' }));
    }
  };

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
      dueDate: schedule.dueDate.split('T')[0],
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
      season: currentSeason || (availableSeasons.length > 0 ? availableSeasons[0].season : ''),
      isActive: true,
    });
    setEditingSchedule(null);
    setError(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const inputClassName =
    'w-full rounded-xl border border-[#d6dde5] bg-white px-3 py-2 text-black transition-all duration-200 focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]';
  const labelClassName = 'mb-2 block text-sm font-semibold text-black';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0D47A1] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="rounded-lg border border-[#f38d68] bg-[#f38d68] px-4 py-2 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#f5a07f]"
        >
          Add Schedule
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-rose-400 bg-rose-100 p-4 text-rose-900">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-[#d6dde5] bg-[#f7f9fb] p-6">
          <h4 className="mb-4 text-lg font-semibold tracking-[-0.03em] text-black">
            {editingSchedule ? 'Edit Payment Schedule' : 'Create New Payment Schedule'}
          </h4>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>
                  Schedule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClassName}
                  placeholder="e.g., Fall 2024 Payment"
                  required
                />
              </div>
              
              <div>
                <label className={labelClassName}>
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className={inputClassName}
                  required
                />
              </div>
              
              <div>
                <label className={labelClassName}>
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={inputClassName}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className={labelClassName}>
                  Season *
                </label>
                <select
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  className={inputClassName}
                  required
                >
                  {availableSeasons.length === 0 ? (
                    <option value="">Loading seasons...</option>
                  ) : (
                    availableSeasons.map((season) => (
                      <option key={season.id} value={season.season}>
                        {season.season} {season.currentSeason ? '(Current)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            
            <div>
              <label className={labelClassName}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={inputClassName}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center rounded-lg border border-[#d6dde5] bg-white px-3 py-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2 h-4 w-4 accent-[#f38d68]"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-black">
                Schedule is active
              </label>
            </div>
            
            <div className="flex gap-3 pt-4 justify-between">
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-lg border border-[#f38d68] bg-[#f38d68] px-4 py-2 font-semibold text-black transition-all duration-200 hover:bg-[#f5a07f] disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : (editingSchedule ? 'Update Schedule' : 'Create Schedule')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-[#d6dde5] bg-white px-4 py-2 font-semibold text-black transition-all duration-200 hover:bg-[#f7f9fb]"
                >
                  Cancel
                </button>
              </div>
              
              {editingSchedule && editingSchedule.isActive && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingSchedule.id)}
                  className="rounded-lg border border-rose-400 bg-rose-100 px-4 py-2 font-semibold text-rose-900 transition-all duration-200 hover:bg-rose-200"
                >
                  Deactivate Schedule
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[#788896]">No payment schedules found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`rounded-xl border p-4 ${
                schedule.isActive 
                  ? 'border-[#d6dde5] bg-white'
                  : 'border-slate-300 bg-slate-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold tracking-[-0.02em] text-black">{schedule.name}</h4>
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      schedule.isActive 
                        ? 'border-emerald-400 bg-emerald-100 text-emerald-900'
                        : 'border-slate-300 bg-slate-200 text-slate-700'
                    }`}>
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-[#788896] md:grid-cols-3">
                    <span>Due: {new Date(schedule.dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
                    <span className="font-semibold text-emerald-800">Amount: ${parseFloat(schedule.amount).toFixed(2)}</span>
                    <span>Season: {schedule.season}</span>
                  </div>
                  {schedule.description && (
                    <p className="mt-2 text-sm text-[#788896]">{schedule.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="rounded-lg border border-amber-400 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900 transition-colors duration-200 hover:bg-amber-200"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
